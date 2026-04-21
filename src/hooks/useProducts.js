import { useState, useEffect } from "react";
import {
  collection, onSnapshot, doc, deleteDoc,
  getDocs, writeBatch, serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";

const FIREBASE_READY = !!import.meta.env.VITE_FIREBASE_API_KEY && !import.meta.env.VITE_FIREBASE_API_KEY.startsWith("sua-");
const MAX_FREE_PRODUCTS = 200;

const localKey = (companyId) => `smartslit-products-${companyId}`;

const getLocalProducts = (companyId) => {
  try { return JSON.parse(localStorage.getItem(localKey(companyId)) || "[]"); }
  catch { return []; }
};

const saveLocalProducts = (companyId, products) => {
  localStorage.setItem(localKey(companyId), JSON.stringify(products));
};

export function useProducts(companyId) {
  const [products, setProducts] = useState(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!companyId) return;

    if (!FIREBASE_READY) {
      setProducts(getLocalProducts(companyId));
      return;
    }

    const colRef = collection(db, "companies", companyId, "products");
    const unsub = onSnapshot(colRef, (snap) => {
      setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [companyId]);

  const uploadFromExcel = async (parsedRows) => {
    if (!companyId) return;
    if (parsedRows.length > MAX_FREE_PRODUCTS) {
      setStatus(`Limite de ${MAX_FREE_PRODUCTS} produtos no plano gratuito. Seu arquivo tem ${parsedRows.length}.`);
      return;
    }

    setStatus("Salvando catálogo...");

    if (!FIREBASE_READY) {
      const withIds = parsedRows.map((r, i) => ({ ...r, id: `local-${Date.now()}-${i}` }));
      saveLocalProducts(companyId, withIds);
      setProducts(withIds);
      setStatus(`${parsedRows.length} produtos salvos no catálogo.`);
      return;
    }

    try {
      const colRef = collection(db, "companies", companyId, "products");
      const existing = await getDocs(colRef);
      const chunkSize = 490;
      const batches = [];
      let batch = writeBatch(db);
      let count = 0;
      existing.docs.forEach((d) => {
        batch.delete(d.ref);
        count++;
        if (count === chunkSize) { batches.push(batch); batch = writeBatch(db); count = 0; }
      });
      parsedRows.forEach((row) => {
        const ref = doc(colRef);
        batch.set(ref, { ...row, createdAt: serverTimestamp() });
        count++;
        if (count === chunkSize) { batches.push(batch); batch = writeBatch(db); count = 0; }
      });
      batches.push(batch);
      await Promise.all(batches.map((b) => b.commit()));
      setStatus(`${parsedRows.length} produtos salvos no catálogo.`);
    } catch (err) {
      console.error(err);
      setStatus("Erro ao salvar catálogo. Tente novamente.");
    }
  };

  const deleteProduct = async (productId) => {
    if (!companyId) return;
    if (!FIREBASE_READY) {
      const updated = getLocalProducts(companyId).filter((p) => p.id !== productId);
      saveLocalProducts(companyId, updated);
      setProducts(updated);
      return;
    }
    await deleteDoc(doc(db, "companies", companyId, "products", productId));
  };

  const clearCatalog = async () => {
    if (!companyId) return;
    setStatus("Limpando catálogo...");
    if (!FIREBASE_READY) {
      saveLocalProducts(companyId, []);
      setProducts([]);
      setStatus("Catálogo limpo. Usando base padrão.");
      return;
    }
    try {
      const colRef = collection(db, "companies", companyId, "products");
      const existing = await getDocs(colRef);
      const batch = writeBatch(db);
      existing.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
      setStatus("Catálogo limpo. Usando base padrão.");
    } catch (err) {
      console.error(err);
      setStatus("Erro ao limpar catálogo.");
    }
  };

  return { products, status, setStatus, uploadFromExcel, deleteProduct, clearCatalog };
}
