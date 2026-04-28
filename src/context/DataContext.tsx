import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Lead, Project, Client, StrategyItem, OKR, Step, Capture, UserRole, UserStatus, Sale, Seller, Goal, Note, Mission, ClientMetricRecord, ManagerTask, SystemUser } from '../types';
import { 
  auth, 
  db, 
  onAuthStateChanged, 
  onSnapshot, 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  addDoc,
  query,
  where,
  orderBy,
  OperationType,
  handleFirestoreError
} from '../lib/firebase';
import { User as FirebaseUser } from 'firebase/auth';
import { ToastType } from '../components/ui/Toast';

interface DataContextType {
  user: FirebaseUser | null;
  loading: boolean;
  userRole: UserRole;
  userStatus: UserStatus;
  setUserRole: (role: UserRole) => void;
  allUsers: SystemUser[];
  addSystemUser: (email: string, name: string, role: UserRole) => Promise<void>;
  updateUserRoleAndStatus: (userId: string, role: UserRole, status: UserStatus) => Promise<void>;
  deleteSystemUser: (userId: string) => Promise<void>;
  toast: { message: string; type: ToastType } | null;
  showToast: (message: string, type: ToastType) => void;
  hideToast: () => void;
  leads: Lead[];
  addLead: (lead: Omit<Lead, 'id'>) => void;
  moveLead: (id: string, stage: Lead['stage']) => void;
  deleteLead: (id: string) => void;
  
  projects: Project[];
  addProject: (project: Omit<Project, 'id'>) => void;
  updateProjectProgress: (id: string, progress: number) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  
  clients: Client[];
  addClient: (client: Omit<Client, 'id'>) => Client;
  updateClient: (id: string, updates: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  
  strategies: StrategyItem[];
  addStrategy: (strategy: Omit<StrategyItem, 'id'>) => void;
  deleteStrategy: (id: string) => void;
  
  okrs: OKR[];
  addOKR: (okr: Omit<OKR, 'id'>) => void;
  deleteOKR: (id: string) => void;
  
  steps: Step[];
  addStep: (step: Step) => void;
  deleteStep: (id: string) => void;

  captures: Capture[];
  addCapture: (capture: Omit<Capture, 'id'>) => void;
  updateCapture: (id: string, updates: Partial<Capture>) => void;
  deleteCapture: (id: string) => void;

  sales: Sale[];
  addSale: (sale: Omit<Sale, 'id'>) => void;
  
  sellers: Seller[];
  addSeller: (seller: Omit<Seller, 'id'>) => void;
  deleteSeller: (id: string) => void;

  goals: Goal[];
  addGoal: (goal: Omit<Goal, 'id'>) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  getCurrentMonthGoal: () => Goal;

  notes: Note[];
  updateNote: (userId: string, content: string) => void;

  missions: Mission[];
  addMission: (mission: Omit<Mission, 'id' | 'createdAt' | 'completed'>) => void;
  toggleMission: (id: string) => void;
  deleteMission: (id: string) => void;

  clientMetrics: ClientMetricRecord[];
  addClientMetric: (metric: Omit<ClientMetricRecord, 'id'>) => void;
  updateClientMetric: (id: string, updates: Partial<ClientMetricRecord>) => void;

  managerTasks: ManagerTask[];
  addManagerTask: (task: Omit<ManagerTask, 'id' | 'completed'>) => void;
  toggleManagerTask: (id: string) => void;
  deleteManagerTask: (id: string) => void;
  currentUserId: string;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole>('Colaborador');
  const [userStatus, setUserStatus] = useState<UserStatus>('pending');
  const [allUsers, setAllUsers] = useState<SystemUser[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [strategies, setStrategies] = useState<StrategyItem[]>([]);
  const [okrs, setOkrs] = useState<OKR[]>([]);
  const [steps, setSteps] = useState<Step[]>([]);
  const [captures, setCaptures] = useState<Capture[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [clientMetrics, setClientMetrics] = useState<ClientMetricRecord[]>([]);
  const [managerTasks, setManagerTasks] = useState<ManagerTask[]>([]);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const currentUserId = user?.uid || 'guest';

  const showToast = (message: string, type: ToastType) => setToast({ message, type });
  const hideToast = () => setToast(null);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch user role and status from Firestore
        try {
          const isAdmin = firebaseUser.email === 'viniciusbarbosasampaio71@gmail.com' || firebaseUser.email === 'assessoriaomega1@gmail.com';
          
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const unsubscribeUser = onSnapshot(userDocRef, async (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              // For hardcoded admins, always force CEO/Approved even if DB says otherwise
              if (isAdmin) {
                setUserRole('CEO');
                setUserStatus('approved');
              } else {
                setUserRole(data.role as UserRole);
                setUserStatus(data.status as UserStatus);
              }
            } else {
              // If UID doc doesn't exist, check for email-based invitation
              const emailDocRef = doc(db, 'users', firebaseUser.email!.toLowerCase());
              
              // We need a one-time get for the email doc instead of a listener there
              // to avoid infinite loops if we delete it while listening
              import('firebase/firestore').then(async ({ getDoc, deleteDoc: delDoc }) => {
                const emailSnap = await getDoc(emailDocRef);
                
                if (emailSnap.exists()) {
                  const inviteData = emailSnap.data();
                  // CLaim the invite: Create UID doc and Delete Email doc
                  await setDoc(userDocRef, {
                    ...inviteData,
                    avatar: firebaseUser.photoURL || '',
                    preApproved: false // now fully registered
                  });
                  await delDoc(emailDocRef);
                  
                  setUserRole(inviteData.role as UserRole);
                  setUserStatus('approved');
                } else {
                  // No invite found
                  if (isAdmin) {
                    setUserRole('CEO');
                    setUserStatus('approved');
                    
                    const initialData = {
                      email: firebaseUser.email,
                      name: firebaseUser.displayName || 'CEO',
                      role: 'CEO',
                      status: 'approved',
                      avatar: firebaseUser.photoURL || ''
                    };
                    setDoc(userDocRef, initialData);
                  } else {
                    setUserRole('Colaborador');
                    setUserStatus('pending');
                  }
                }
              });
            }
            setUser(firebaseUser);
            setLoading(false);
          });
          return () => unsubscribeUser();
        } catch (error) {
          console.error("Error fetching user role:", error);
          setLoading(false);
        }
      } else {
        setUser(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Listen to all users if CEO
  useEffect(() => {
    if (userRole === 'CEO' && userStatus === 'approved') {
      const unsubscribe = onSnapshot(collection(db, 'users'), (snap) => {
        setAllUsers(snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as SystemUser)));
      });
      return () => unsubscribe();
    }
  }, [userRole, userStatus]);

  const addSystemUser = async (email: string, name: string, role: UserRole) => {
    try {
      // Create user doc with email as ID for pre-approval
      const userRef = doc(db, 'users', email.toLowerCase());
      await setDoc(userRef, {
        email: email.toLowerCase(),
        name,
        role,
        status: 'approved',
        avatar: '',
        preApproved: true
      });
      showToast('Usuário pré-aprovado com sucesso!', 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${email}`);
    }
  };

  const updateUserRoleAndStatus = async (userId: string, role: UserRole, status: UserStatus) => {
    try {
      await updateDoc(doc(db, 'users', userId), { role, status });
      showToast('Usuário atualizado com sucesso!', 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
    }
  };

  const deleteSystemUser = async (userId: string) => {
    try {
      await deleteDoc(doc(db, 'users', userId));
      showToast('Usuário removido!', 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${userId}`);
    }
  };

  // Real-time Listeners
  useEffect(() => {
    if (!user || userStatus !== 'approved') return;

    const unsubscribes = [
      onSnapshot(collection(db, 'clients'), (snap) => {
        setClients(snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Client)));
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'clients')),

      onSnapshot(collection(db, 'sales'), (snap) => {
        setSales(snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Sale)));
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'sales')),

      onSnapshot(collection(db, 'managerTasks'), (snap) => {
        setManagerTasks(snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as ManagerTask)));
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'managerTasks')),

      onSnapshot(collection(db, 'sellers'), (snap) => {
        setSellers(snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Seller)));
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'sellers')),

      onSnapshot(collection(db, 'goals'), (snap) => {
        setGoals(snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Goal)));
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'goals')),

      onSnapshot(collection(db, 'clientMetrics'), (snap) => {
        setClientMetrics(snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as ClientMetricRecord)));
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'clientMetrics')),

      onSnapshot(collection(db, 'leads'), (snap) => {
        setLeads(snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Lead)));
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'leads')),

      onSnapshot(collection(db, 'projects'), (snap) => {
        setProjects(snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Project)));
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'projects')),

      onSnapshot(collection(db, 'captures'), (snap) => {
        setCaptures(snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Capture)));
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'captures')),

      onSnapshot(collection(db, 'missions'), (snap) => {
        setMissions(snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Mission)));
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'missions')),

      onSnapshot(query(collection(db, 'notes'), where('userId', '==', user.uid)), (snap) => {
        setNotes(snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Note)));
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'notes'))
    ];

    return () => unsubscribes.forEach(unsub => unsub());
  }, [user]);

  const addLead = (lead: Omit<Lead, 'id'>) => {
    addDoc(collection(db, 'leads'), lead)
      .catch(err => handleFirestoreError(err, OperationType.CREATE, 'leads'));
  };

  const moveLead = (id: string, stage: Lead['stage']) => {
    updateDoc(doc(db, 'leads', id), { stage })
      .catch(err => handleFirestoreError(err, OperationType.UPDATE, `leads/${id}`));
  };

  const deleteLead = (id: string) => {
    deleteDoc(doc(db, 'leads', id))
      .catch(err => handleFirestoreError(err, OperationType.DELETE, `leads/${id}`));
  };

  const addProject = (project: Omit<Project, 'id'>) => {
    addDoc(collection(db, 'projects'), project)
      .catch(err => handleFirestoreError(err, OperationType.CREATE, 'projects'));
  };

  const updateProjectProgress = (id: string, progress: number) => {
    updateDoc(doc(db, 'projects', id), { progress })
      .catch(err => handleFirestoreError(err, OperationType.UPDATE, `projects/${id}`));
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    updateDoc(doc(db, 'projects', id), updates)
      .catch(err => handleFirestoreError(err, OperationType.UPDATE, `projects/${id}`));
  };

  const deleteProject = (id: string) => {
    deleteDoc(doc(db, 'projects', id))
      .catch(err => handleFirestoreError(err, OperationType.DELETE, `projects/${id}`));
  };

  const addClient = (client: Omit<Client, 'id'>) => {
    const clientData = { ...client, createdAt: new Date().toISOString() };
    addDoc(collection(db, 'clients'), clientData)
      .catch(err => handleFirestoreError(err, OperationType.CREATE, 'clients'));
    return { ...clientData, id: 'temp' } as Client;
  };

  const updateClient = (id: string, updates: Partial<Client>) => {
    updateDoc(doc(db, 'clients', id), updates)
      .catch(err => handleFirestoreError(err, OperationType.UPDATE, `clients/${id}`));
  };

  const deleteClient = (id: string) => {
    deleteDoc(doc(db, 'clients', id))
      .catch(err => handleFirestoreError(err, OperationType.DELETE, `clients/${id}`));
  };

  const addStrategy = (strategy: Omit<StrategyItem, 'id'>) => {
    setStrategies([...strategies, { ...strategy, id: Math.random().toString(36).substr(2, 9), client: 'N/A', tags: [] }]);
  };

  const deleteStrategy = (id: string) => {
    setStrategies(strategies.filter(s => s.id !== id));
  };

  const addOKR = (okr: Omit<OKR, 'id'>) => {
    setOkrs([...okrs, { ...okr, id: Math.random().toString(36).substr(2, 9) }]);
  };

  const deleteOKR = (id: string) => {
    setOkrs(okrs.filter(o => o.id !== id));
  };

  const addStep = (step: Step) => {
    setSteps([...steps, step]);
  };

  const deleteStep = (id: string) => {
    setSteps(steps.filter(s => s.action !== id));
  };

  const addCapture = (capture: Omit<Capture, 'id'>) => {
    addDoc(collection(db, 'captures'), capture)
      .catch(err => handleFirestoreError(err, OperationType.CREATE, 'captures'));
  };

  const updateCapture = (id: string, updates: Partial<Capture>) => {
    updateDoc(doc(db, 'captures', id), updates)
      .catch(err => handleFirestoreError(err, OperationType.UPDATE, `captures/${id}`));
  };

  const deleteCapture = (id: string) => {
    deleteDoc(doc(db, 'captures', id))
      .catch(err => handleFirestoreError(err, OperationType.DELETE, `captures/${id}`));
  };

  const addSale = (sale: Omit<Sale, 'id'>) => {
    addDoc(collection(db, 'sales'), sale)
      .catch(err => handleFirestoreError(err, OperationType.CREATE, 'sales'));
  };

  const addSeller = (seller: Omit<Seller, 'id'>) => {
    addDoc(collection(db, 'sellers'), seller)
      .catch(err => handleFirestoreError(err, OperationType.CREATE, 'sellers'));
  };

  const deleteSeller = (id: string) => {
    deleteDoc(doc(db, 'sellers', id))
      .catch(err => handleFirestoreError(err, OperationType.DELETE, `sellers/${id}`));
  };

  const addGoal = (goal: Omit<Goal, 'id'>) => {
    addDoc(collection(db, 'goals'), goal)
      .catch(err => handleFirestoreError(err, OperationType.CREATE, 'goals'));
  };

  const updateGoal = (id: string, updates: Partial<Goal>) => {
    updateDoc(doc(db, 'goals', id), updates)
      .catch(err => handleFirestoreError(err, OperationType.UPDATE, `goals/${id}`));
  };

  const getCurrentMonthGoal = () => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const existingGoal = goals.find(g => g.month === currentMonth);
    
    const activeClientsValue = clients
      .filter(c => c.status === 'Ativo')
      .reduce((acc, c) => {
        const clean = c.revenue.replace(/[R$\.\/mês\s]/g, '').replace(',', '.');
        return acc + (parseFloat(clean) || 0);
      }, 0);

    if (existingGoal) {
      if (existingGoal.renewalTarget === 0) {
        return { ...existingGoal, renewalTarget: activeClientsValue };
      }
      return existingGoal;
    }

    return {
      id: 'temp',
      month: currentMonth,
      targetValue: 0,
      renewalTarget: activeClientsValue
    };
  };

  const updateNote = (userId: string, content: string) => {
    const existing = notes.find(n => n.userId === userId);
    if (existing) {
      updateDoc(doc(db, 'notes', existing.id), { content, updatedAt: new Date().toISOString() })
        .catch(err => handleFirestoreError(err, OperationType.UPDATE, `notes/${existing.id}`));
    } else {
      addDoc(collection(db, 'notes'), { userId, content, updatedAt: new Date().toISOString() })
        .catch(err => handleFirestoreError(err, OperationType.CREATE, 'notes'));
    }
  };

  const addMission = (mission: Omit<Mission, 'id' | 'createdAt' | 'completed'>) => {
    addDoc(collection(db, 'missions'), { 
      ...mission, 
      createdAt: new Date().toISOString(),
      completed: false 
    }).catch(err => handleFirestoreError(err, OperationType.CREATE, 'missions'));
  };

  const toggleMission = (id: string) => {
    const mission = missions.find(m => m.id === id);
    if (mission) {
      updateDoc(doc(db, 'missions', id), { completed: !mission.completed })
        .catch(err => handleFirestoreError(err, OperationType.UPDATE, `missions/${id}`));
    }
  };

  const deleteMission = (id: string) => {
    deleteDoc(doc(db, 'missions', id))
      .catch(err => handleFirestoreError(err, OperationType.DELETE, `missions/${id}`));
  };

  const addClientMetric = (metric: Omit<ClientMetricRecord, 'id'>) => {
    addDoc(collection(db, 'clientMetrics'), metric)
      .catch(err => handleFirestoreError(err, OperationType.CREATE, 'clientMetrics'));
  };

  const updateClientMetric = (id: string, updates: Partial<ClientMetricRecord>) => {
    updateDoc(doc(db, 'clientMetrics', id), updates)
      .catch(err => handleFirestoreError(err, OperationType.UPDATE, `clientMetrics/${id}`));
  };

  const addManagerTask = (task: Omit<ManagerTask, 'id' | 'completed'>) => {
    addDoc(collection(db, 'managerTasks'), { ...task, completed: false })
      .catch(err => handleFirestoreError(err, OperationType.CREATE, 'managerTasks'));
  };

  const toggleManagerTask = (id: string) => {
    const task = managerTasks.find(t => t.id === id);
    if (task) {
      updateDoc(doc(db, 'managerTasks', id), { completed: !task.completed })
        .catch(err => handleFirestoreError(err, OperationType.UPDATE, `managerTasks/${id}`));
    }
  };

  const deleteManagerTask = (id: string) => {
    deleteDoc(doc(db, 'managerTasks', id))
      .catch(err => handleFirestoreError(err, OperationType.DELETE, `managerTasks/${id}`));
  };

  return (
    <DataContext.Provider value={{
      user, loading,
      userRole, setUserRole,
      userStatus,
      allUsers,
      addSystemUser,
      updateUserRoleAndStatus,
      deleteSystemUser,
      toast, showToast, hideToast,
      leads, addLead, moveLead, deleteLead,
      projects, addProject, updateProjectProgress, updateProject, deleteProject,
      clients, addClient, updateClient, deleteClient,
      strategies, addStrategy, deleteStrategy,
      okrs, addOKR, deleteOKR, steps, addStep, deleteStep,
      captures, addCapture, updateCapture, deleteCapture,
      sales, addSale, sellers, addSeller, deleteSeller, 
      goals, addGoal, updateGoal, getCurrentMonthGoal,
      notes, updateNote,
      missions, addMission, toggleMission, deleteMission,
      clientMetrics, addClientMetric, updateClientMetric,
      managerTasks, addManagerTask, toggleManagerTask, deleteManagerTask, currentUserId
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within a DataProvider');
  return context;
};
