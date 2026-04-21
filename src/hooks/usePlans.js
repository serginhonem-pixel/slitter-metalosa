import { useState, useEffect } from "react";
import {
  collection, onSnapshot, addDoc, deleteDoc, doc,
  query, orderBy, limit, serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";

const FIREBASE_READY = !!import.meta.env.VITE_FIREBASE_API_KEY && !import.meta.env.VITE_FIREBASE_API_KEY.startsWith("sua-");
const MAX_FREE_PLANS = 20;

const localKey = (companyId) => `smartslit-plans-${companyId}`;

const getLocalPlans = (companyId) => {
  try { return JSON.parse(localStorage.getItem(localKey(companyId)) || "[]"); }
  catch { return []; }
};

const saveLocalPlans = (companyId, plans) => {
  localStorage.setItem(localKey(companyId), JSON.stringify(plans));
};

export function usePlans(companyId) {
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    if (!companyId) return;

    if (!FIREBASE_READY) {
      setPlans(getLocalPlans(companyId));
      return;
    }

    const q = query(
      collection(db, "companies", companyId, "plans"),
      orderBy("createdAt", "desc"),
      limit(MAX_FREE_PLANS)
    );
    const unsub = onSnapshot(q, (snap) => {
      setPlans(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [companyId]);

  const savePlan = async (name, mode, machineConfig, demands, results) => {
    if (!companyId) return;

    if (plans.length >= MAX_FREE_PLANS) {
      throw new Error(`Limite de ${MAX_FREE_PLANS} planos no plano gratuito.`);
    }

    if (!FIREBASE_READY) {
      const newPlan = {
        id: `local-plan-${Date.now()}`,
        name, mode, machineConfig, demands, results,
        summary: {
          efficiency: parseFloat(results.stats.efficiency),
          totalCoils: results.stats.totalCoils,
          totalInputWeight: results.stats.totalInputWeight,
          totalScrapWeight: parseFloat(results.stats.totalScrapWeight),
        },
        createdAt: Date.now(),
      };
      const updated = [newPlan, ...getLocalPlans(companyId)].slice(0, MAX_FREE_PLANS);
      saveLocalPlans(companyId, updated);
      setPlans(updated);
      return;
    }

    const colRef = collection(db, "companies", companyId, "plans");
    await addDoc(colRef, {
      name, mode, machineConfig, demands, results,
      summary: {
        efficiency: parseFloat(results.stats.efficiency),
        totalCoils: results.stats.totalCoils,
        totalInputWeight: results.stats.totalInputWeight,
        totalScrapWeight: parseFloat(results.stats.totalScrapWeight),
      },
      createdAt: serverTimestamp(),
    });
  };

  const deletePlan = async (planId) => {
    if (!FIREBASE_READY) {
      const updated = getLocalPlans(companyId).filter((p) => p.id !== planId);
      saveLocalPlans(companyId, updated);
      setPlans(updated);
      return;
    }
    await deleteDoc(doc(db, "companies", companyId, "plans", planId));
  };

  return { plans, savePlan, deletePlan };
}
