import { collection, doc, addDoc, setDoc, deleteDoc, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export const CANTEEN_COLLECTION = 'canteenMenu';
export const STATIONARY_COLLECTION = 'stationaryItems';

export const listenCanteenMenu = (onChange: (items: any[]) => void) => {
  const ref = collection(db, CANTEEN_COLLECTION);
  const q = query(ref, orderBy('createdAt', 'asc'));
  return onSnapshot(q, (snap) => {
    const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    onChange(data as any[]);
  });
};

export const upsertCanteenItem = async (item: any) => {
  // Restrict to allowed fields
  const allowed = {
    name: item.name,
    description: item.description,
    price: item.price,
    category: item.category,
    availability: item.availability,
    preparationTime: item.preparationTime,
    image: item.image || null
  } as any;
  if (item.id) {
    const ref = doc(collection(db, CANTEEN_COLLECTION), item.id);
    await setDoc(ref, { ...allowed, updatedAt: serverTimestamp() }, { merge: true });
    return item.id as string;
  }
  const ref = collection(db, CANTEEN_COLLECTION);
  const res = await addDoc(ref, { ...allowed, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  return res.id;
};

export const deleteCanteenItem = async (id: string) => {
  const ref = doc(collection(db, CANTEEN_COLLECTION), id);
  await deleteDoc(ref);
};

export const listenStationaryItems = (onChange: (items: any[]) => void) => {
  const ref = collection(db, STATIONARY_COLLECTION);
  const q = query(ref, orderBy('createdAt', 'asc'));
  return onSnapshot(q, (snap) => {
    const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    onChange(data as any[]);
  });
};

export const upsertStationaryItem = async (item: any) => {
  const base: any = {
    name: item.name,
    description: item.description,
    category: item.category,
    price: item.price,
    lastRestocked: item.lastRestocked,
    status: item.status,
    specifications: item.specifications || null,
    image: item.image || null
  };
  if (typeof item.stockQuantity === 'number') {
    base.stockQuantity = item.stockQuantity;
  }
  const allowed = base;
  if (item.id) {
    const ref = doc(collection(db, STATIONARY_COLLECTION), item.id);
    await setDoc(ref, { ...allowed, updatedAt: serverTimestamp() }, { merge: true });
    return item.id as string;
  }
  const ref = collection(db, STATIONARY_COLLECTION);
  const res = await addDoc(ref, { ...allowed, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  return res.id;
};

export const deleteStationaryItem = async (id: string) => {
  const ref = doc(collection(db, STATIONARY_COLLECTION), id);
  await deleteDoc(ref);
};


