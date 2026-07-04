import React, { useState, useEffect, useMemo } from 'react';
import { 
  Home, 
  Calendar, 
  Heart, 
  Sparkles, 
  TrendingUp, 
  Settings, 
  Plus, 
  Check, 
  X, 
  Clock, 
  BookOpen, 
  AlertCircle, 
  Trash2,
  Edit2,
  User,
  Coffee,
  Compass,
  Info,
  Dumbbell,
  Save,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

const MOTIVATIONAL_QUOTES = [
  "Você não precisa ser perfeita para continuar evoluindo.",
  "O autocuidado é uma jornada lenta, gentil e sem punições.",
  "Cada respiração é um novo começo. Seja bondosa com sua história.",
  "O progresso não é linear. Cair e levantar faz parte do caminho da cura.",
  "Sua paz vale mais do que qualquer impulso. Você está segura agora."
];

export default function App() {
  const [activeTab, setActiveTab] = useState('inicio'); 
  const [theme, setTheme] = useState('light'); 
  const [showSos, setShowSos] = useState(false);
  const [userName, setUserName] = useState("Maria");

  // Estados da aba Treino
  const diasDaSemana = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];
  const [trainingDays, setTrainingDays] = useState({}); // { 'Segunda-feira': 'Glúteos e Posterior' }
  const [exercises, setExercises] = useState({}); // { 'Segunda-feira': [{id, nome, ordem}] }
  
  const [editingDay, setEditingDay] = useState(null);
  const [tempDayDesc, setTempDayDesc] = useState('');
  
  const [newExercise, setNewExercise] = useState({ day: null, name: '' });

  // Estados da aba Alimentação
  const mealTypes = ['Café da manhã', 'Almoço', 'Café da tarde', 'Janta', 'Ceia'];
  const [meals, setMeals] = useState({}); // { 'Café da manhã': [{id, nome, quantidade}] }
  const [newMealItem, setNewMealItem] = useState({ type: null, name: '', amount: '' });
  const [editingMeal, setEditingMeal] = useState(null); // { id, name, amount, type }

  const [shoppingList, setShoppingList] = useState([]); // [{id, nome, concluido}]
  const [newShoppingItem, setNewShoppingItem] = useState('');
  
  const [dbStatus, setDbStatus] = useState('connecting'); // connected, connecting, offline
  const [checkIns, setCheckIns] = useState([]);
  const [episodes, setEpisodes] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [smallVictories, setSmallVictories] = useState([]);
  const [diaryEntries, setDiaryEntries] = useState([]);
  
  const [recoveryPlan, setRecoveryPlan] = useState({
    triggers: 'Ansiedade no final do dia, cansaço extremo pós-trabalho, sentimentos de solidão ou tédio.',
    helpers: 'Ligar para minha irmã, tomar um chá de camomila bem quente, fazer a respiração guiada de 4 segundos.',
    difficultTimes: 'Entre as 19h e 22h, especialmente após dias estressantes.',
    reasonToHeal: 'Quero me sentir em paz com meu corpo, ter energia para as minhas atividades e parar de sentir a culpa que me consome.',
    vulnerableReminder: 'Lembre-se: Essa onda de urgência vai passar. Ela dura em média 15 minutos. Você é muito mais forte do que este momento. Respire.'
  });
  
  const [manualStreakOverride, setManualStreakOverride] = useState(() => {
    const saved = localStorage.getItem('ancora_manualStreakOverride');
    return saved !== null ? parseInt(saved) : null;
  });
  const [manualMaxStreakOverride, setManualMaxStreakOverride] = useState(() => {
    const saved = localStorage.getItem('ancora_manualMaxStreakOverride');
    return saved !== null ? parseInt(saved) : null;
  });
  const [targetDays, setTargetDays] = useState(() => {
    const saved = localStorage.getItem('ancora_targetDays');
    return saved !== null ? parseInt(saved) : 30;
  });
  
  const [isEditingStreak, setIsEditingStreak] = useState(false);
  const [tempCurrentStreak, setTempCurrentStreak] = useState(18);
  const [tempMaxStreak, setTempMaxStreak] = useState(42);
  const [tempTargetDays, setTempTargetDays] = useState(30);

  const [showSuccessToast, setShowSuccessToast] = useState(null);
  const [hoveredDay, setHoveredDay] = useState(null);

  const todayStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const calendarMeta = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = d.getMonth(); // 0-11
    const day = d.getDate();
    
    const monthNames = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", 
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startingDay = new Date(year, month, 1).getDay(); // 0 = Dom, 1 = Seg...

    return {
      year,
      month,
      monthName: monthNames[month],
      day,
      daysInMonth,
      startingDay
    };
  }, []);

  const fetchAllData = async () => {
    try {
      setDbStatus('connecting');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      // 1. Buscar Check-ins
      const resCheck = await fetch('https://ancora-app-1.onrender.com/api/checkins', { signal: controller.signal });
      if (resCheck.ok) {
        const data = await resCheck.json();
        setCheckIns(data);
      }
      
      // 2. Buscar Episódios
      const resEp = await fetch('https://ancora-app-1.onrender.com/api/episodes', { signal: controller.signal }); 
      if (resEp.ok) {
        const data = await resEp.json();
        setEpisodes(data);
      }

      // 3. Buscar Desafios Reais
      const resChall = await fetch('https://ancora-app-1.onrender.com/api/challenges', { signal: controller.signal }); 
      if (resChall.ok) {
        const data = await resChall.json();
        setChallenges(data);
      }

      // 4. Buscar Plano de Recuperação
      const resPlan = await fetch('https://ancora-app-1.onrender.com/api/recovery-plan', { signal: controller.signal }); 
      if (resPlan.ok) {
        const data = await resPlan.json();
        if (data && data.usuario_id) {
          setRecoveryPlan({
            triggers: data.gatilhos || '',
            helpers: data.ajudas || '',
            difficultTimes: data.horarios_dificeis || '',
            reasonToHeal: data.motivo || '',
            vulnerableReminder: data.lembrete || ''
          });
        }
      }

      // 5. Buscar Diário
      const resDiary = await fetch('https://ancora-app-1.onrender.com/api/diary', { signal: controller.signal }); 
      if (resDiary.ok) {
        const data = await resDiary.json();
        setDiaryEntries(data.map(d => ({
          id: d.id,
          date: d.data ? d.data.split('T')[0] : d.date,
          text: d.texto || d.text || '',
          prompt: d.prompt || ''
        })));
      }

      // 6. Buscar Pequenas Vitórias
      const resVic = await fetch('https://ancora-app-1.onrender.com/api/victories', { signal: controller.signal }); 
      if (resVic.ok) {
        const data = await resVic.json();
        setSmallVictories(data.map(v => ({
          id: v.id,
          date: v.data ? v.data.split('T')[0] : v.date,
          title: v.titulo || v.title || '',
          description: v.descricao || v.description || '',
          category: v.categoria || v.category || 'Gatilho'
        })));
      }

      // 7. Buscar Dados de Treino
      const resDays = await fetch('https://ancora-app-1.onrender.com/api/training/days', { signal: controller.signal });
      if (resDays.ok) {
        const data = await resDays.json();
        const daysMap = {};
        data.forEach(d => { daysMap[d.dia_semana] = d.descricao; });
        setTrainingDays(daysMap);
      }

      const resExercises = await fetch('https://ancora-app-1.onrender.com/api/training/exercises', { signal: controller.signal });
      if (resExercises.ok) {
        const data = await resExercises.json();
        const exMap = {};
        diasDaSemana.forEach(d => exMap[d] = []);
        data.forEach(ex => {
            if (!exMap[ex.dia_semana]) exMap[ex.dia_semana] = [];
            exMap[ex.dia_semana].push(ex);
        });
        setExercises(exMap);
      }

      // 8. Buscar Alimentação e Compras
      const resMeals = await fetch('https://ancora-app-1.onrender.com/api/meals', { signal: controller.signal });
      if (resMeals.ok) {
        const data = await resMeals.json();
        const mMap = {};
        mealTypes.forEach(t => mMap[t] = []);
        data.forEach(m => {
            if (!mMap[m.tipo_refeicao]) mMap[m.tipo_refeicao] = [];
            mMap[m.tipo_refeicao].push(m);
        });
        setMeals(mMap);
      }

      const resShopping = await fetch('https://ancora-app-1.onrender.com/api/shopping', { signal: controller.signal });
      if (resShopping.ok) {
        setShoppingList(await resShopping.json());
      }

      clearTimeout(timeoutId);
      setDbStatus('connected');
    } catch (err) {
      setDbStatus('offline');
      console.warn("Modo offline: O frontend está usando armazenamento de estado local.");
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const calculatedMetrics = useMemo(() => {
    if (episodes.length === 0 && checkIns.length === 0) {
      return {
        currentStreak: manualStreakOverride !== null ? manualStreakOverride : 0,
        maxStreak: manualMaxStreakOverride !== null ? manualMaxStreakOverride : 0
      };
    }

    const today = new Date(todayStr);
    let current = 0;
    let checkDate = new Date(today);
    
    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      const hasEpisode = episodes.some(e => e.date === dateStr);
      const hasCheckIn = checkIns.some(c => c.date === dateStr);
      
      if (hasEpisode) break;
      
      if (hasCheckIn || dateStr === todayStr) {
        current++;
      } else {
        const oldestCheckin = checkIns.reduce((oldest, current) => {
          return new Date(current.date) < new Date(oldest) ? current.date : oldest;
        }, todayStr);
        
        if (checkDate < new Date(oldestCheckin)) break;
        current++; 
      }
      
      checkDate.setDate(checkDate.getDate() - 1);
      if (current > 365) break;
    }

    let max = 17; 
    let currentRun = 0;
    let runDate = new Date("2026-06-01"); 
    const endDate = new Date(todayStr);

    while (runDate <= endDate) {
      const dateStr = runDate.toISOString().split('T')[0];
      const hasEpisode = episodes.some(e => e.date === dateStr);
      if (hasEpisode) {
        if (currentRun > max) max = currentRun;
        currentRun = 0;
      } else {
        const hasCheckIn = checkIns.some(c => c.date === dateStr);
        if (hasCheckIn || dateStr === todayStr) {
          currentRun++;
        }
      }
      runDate.setDate(runDate.getDate() + 1);
    }
    if (currentRun > max) max = currentRun;

    return {
      currentStreak: manualStreakOverride !== null ? manualStreakOverride : current,
      maxStreak: manualMaxStreakOverride !== null ? manualMaxStreakOverride : Math.max(42, max)
    };
  }, [checkIns, episodes, manualStreakOverride, manualMaxStreakOverride, todayStr]);

  const activeChallenge = challenges[0] || null;

  const [showAddEpisode, setShowAddEpisode] = useState(false);
  const [showAddVictory, setShowAddVictory] = useState(false);
  const [selectedCalendarDay, setSelectedCalendarDay] = useState(null);
  const [quotes, setQuotes] = useState(MOTIVATIONAL_QUOTES);
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);

  const [formCheckin, setFormCheckin] = useState({
    mood: '😌',
    urge: 3,
    eatRegular: 'Sim',
    sleepWell: 'Sim',
    symptoms: [],
    notes: ''
  });

  const [formEpisode, setFormEpisode] = useState({
    date: todayStr,
    time: '20:00',
    intensity: 5,
    triggers: '',
    notes: ''
  });

  const [formVictory, setFormVictory] = useState({
    title: '',
    description: '',
    category: 'Gatilho'
  });

  const [formDiary, setFormDiary] = useState({
    text: '',
    prompt: 'O que aconteceu hoje?'
  });

  const [showCreateChallenge, setShowCreateChallenge] = useState(false);
  const [sosTimer, setSosTimer] = useState(600);
  const [isSosTimerRunning, setIsSosTimerRunning] = useState(false);
  const [sosPhase, setSosPhase] = useState('breath'); 
  const [breathState, setBreathState] = useState('Inspire'); 
  const [breathCounter, setBreathCounter] = useState(4);
  const [sosPostStatus, setSosPostStatus] = useState(null);
  const [simulateSpeed, setSimulateSpeed] = useState(false);

  const [newChallenge, setNewChallenge] = useState({
    title: '',
    duration: 15,
    description: '',
    items: ['Beber água', 'Fazer check-in']
  });
  const [newChallengeItemInput, setNewChallengeItemInput] = useState('');

  useEffect(() => {
    let breathInterval;
    if (showSos && sosPhase === 'breath') {
      breathInterval = setInterval(() => {
        setBreathCounter((prev) => {
          if (prev <= 1) {
            if (breathState === 'Inspire') {
              setBreathState('Prenda');
              return 4;
            } else if (breathState === 'Prenda') {
              setBreathState('Expire');
              return 4;
            } else {
              setBreathState('Inspire');
              return 4;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(breathInterval);
  }, [showSos, sosPhase, breathState]);

  useEffect(() => {
    let timerInterval;
    if (showSos && sosPhase === 'timer' && isSosTimerRunning) {
      const step = simulateSpeed ? 30 : 1; 
      timerInterval = setInterval(() => {
        setSosTimer((prev) => {
          if (prev <= step) {
            setIsSosTimerRunning(false);
            setSosPhase('post');
            return 0;
          }
          return prev - step;
        });
      }, 1000);
    }
    return () => clearInterval(timerInterval);
  }, [showSos, sosPhase, isSosTimerRunning, simulateSpeed]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuoteIndex((prev) => (prev + 1) % quotes.length);
    }, 15000); 
    return () => clearInterval(interval);
  }, [quotes]);

  const handleSaveCustomStreak = (e) => {
    e.preventDefault();
    const finalCurrent = Math.max(0, tempCurrentStreak);
    const finalMax = Math.max(0, tempMaxStreak);
    const finalTarget = Math.max(1, tempTargetDays);

    setManualStreakOverride(finalCurrent);
    setManualMaxStreakOverride(finalMax);
    setTargetDays(finalTarget);

    localStorage.setItem('ancora_manualStreakOverride', finalCurrent);
    localStorage.setItem('ancora_manualMaxStreakOverride', finalMax);
    localStorage.setItem('ancora_targetDays', finalTarget);

    setIsEditingStreak(false);
    triggerNotification("Sequência de dias atualizada com sucesso!");
  };

  const handleOpenStreakEditor = () => {
    setTempCurrentStreak(calculatedMetrics.currentStreak);
    setTempMaxStreak(calculatedMetrics.maxStreak);
    setTempTargetDays(targetDays);
    setIsEditingStreak(true);
  };

  const handleDeleteChallenge = async (id) => {
    try {
      const response = await fetch(`https://ancora-app-1.onrender.com/api/challenges/${id}`, { 
        method: 'DELETE'
      });  
      if (response.ok) {
        await fetchAllData();
        triggerNotification("Desafio removido! 💜");
      }
    } catch (err) {
      setChallenges(challenges.filter(c => c.id !== id));
      triggerNotification("Desafio removido localmente.");
    }
  };

  const progressPercent = Math.min(100, (calculatedMetrics.currentStreak / targetDays) * 100);

  const handleToggleChallengeItem = async (challengeId, itemId) => {
    const targetChallenge = challenges.find(c => c.id === challengeId);
    if (!targetChallenge) return;
    const targetItem = targetChallenge.checklist.find(i => i.id === itemId);
    if (!targetItem) return;

    const newCompletedState = !targetItem.completed;

    // Atualização otimista
    setChallenges(challenges.map(c => c.id === challengeId ? {
      ...c,
      checklist: c.checklist.map(item => item.id === itemId ? { ...item, completed: newCompletedState } : item)
    } : c));

    try {
      const response = await fetch(`https://ancora-app-1.onrender.com/api/challenges/items/${itemId}`, { 
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: newCompletedState, challengeId: challengeId })
      });
      
      const data = await response.json();
      // Se o backend avançou o dia, recarrega tudo
      if (data.advanced) {
              await fetchAllData(); 
              triggerNotification("Dia concluído com sucesso! 💜");
            }
          } catch (err) {
            console.warn("Erro ao sincronizar status.");
            triggerNotification("Erro na sincronização com o servidor. ⚠️");
          }
        };

  const triggerNotification = (msg) => {
    setShowSuccessToast(msg);
    setTimeout(() => setShowSuccessToast(null), 4000);
  };

  const handleAddCheckin = async (e) => {
    e.preventDefault();
    
    const newCheck = {
      data: todayStr,
      mood: formCheckin.mood,
      urge: formCheckin.urge,
      eatRegular: formCheckin.eatRegular,
      sleepWell: formCheckin.sleepWell,
      symptoms: formCheckin.symptoms,
      notes: formCheckin.notes
    };

    try {
      const response = await fetch('https://ancora-app-1.onrender.com/api/checkins', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCheck)
      });
      
      if (response.ok) {
        await fetchAllData();
        triggerNotification("Check-in de hoje salvo de forma persistente! 💜");
        setActiveTab('inicio');
      }
    } catch (err) {
      const filtered = checkIns.filter(c => c.date !== todayStr);
      setCheckIns([newCheck, ...filtered]);
      triggerNotification("Check-in guardado localmente (Modo Offline). 💜");
      setActiveTab('inicio');
    }

    if (challenges.length > 0) {
      setChallenges(challenges.map(c => ({
        ...c,
        checklist: c.checklist.map(it => 
          it.text.toLowerCase().includes("check-in") || it.text.toLowerCase().includes("checkin")
            ? { ...it, completed: true } 
            : it
        )
      })));
    }

    const winCheck = smallVictories.find(v => v.date === todayStr && v.title === "Fiz meu check-in diário");
    if (!winCheck) {
      setSmallVictories([
        {
          id: Date.now(),
          date: todayStr,
          title: "Fiz meu check-in diário",
          description: "Estou construindo autoconsciência registrando meu progresso.",
          category: "Rotina"
        },
        ...smallVictories
      ]);
    }
  };

  const handleAddEpisode = async (e) => {
    e.preventDefault();
    const newEp = {
      date: formEpisode.date,
      time: formEpisode.time,
      intensity: formEpisode.intensity,
      triggers: formEpisode.triggers || "Ansiedade / Estresse",
      notes: formEpisode.notes
    };
    
    try {
      const response = await fetch('https://ancora-app-1.onrender.com/api/episodes', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEp)
      });

      if (response.ok) {
        await fetchAllData();
        setShowAddEpisode(false);
        setManualStreakOverride(0);
        localStorage.setItem('ancora_manualStreakOverride', 0);
        triggerNotification("Registro acolhido com sucesso. Não há julgamentos aqui. 💜");
        setFormEpisode({
          date: todayStr,
          time: "20:00",
          intensity: 5,
          triggers: '',
          notes: ''
        });
        setActiveTab('inicio');
      }
    } catch (err) {
      const localEp = {
        ...newEp,
        id: Date.now()
      };
      setEpisodes([localEp, ...episodes]);
      setShowAddEpisode(false);
      setManualStreakOverride(0);
      localStorage.setItem('ancora_manualStreakOverride', 0);
      triggerNotification("Registro guardado localmente (Modo Offline). 💜");
      setActiveTab('inicio');
    }
  };

  const handleAddVictory = async (e) => {
    e.preventDefault();
    if (!formVictory.title.trim()) return;
    const newVic = {
      date: todayStr,
      title: formVictory.title,
      description: formVictory.description || "Sem descrição adicional",
      category: formVictory.category
    };

    try {
      const response = await fetch('https://ancora-app-1.onrender.com/api/victories', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newVic)
      });
      if (response.ok) {
        await fetchAllData();
        setShowAddVictory(false);
        setFormVictory({ title: '', description: '', category: 'Gatilho' });
        triggerNotification("Vitória registrada! 💜");
      }
    } catch (err) {
      setSmallVictories([{ id: Date.now(), ...newVic }, ...smallVictories]);
      setShowAddVictory(false);
      setFormVictory({ title: '', description: '', category: 'Gatilho' });
      triggerNotification("Vitória registrada localmente (Modo Offline)!");
    }
  };

  const handleUpdateRecoveryPlan = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('https://ancora-app-1.onrender.com/api/recovery-plan', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          triggers: recoveryPlan.triggers,
          helpers: recoveryPlan.helpers,
          difficultTimes: recoveryPlan.difficultTimes,
          reasonToHeal: recoveryPlan.reasonToHeal,
          vulnerableReminder: recoveryPlan.vulnerableReminder
        })
      });
      if (response.ok) {
        triggerNotification("Seu plano de recuperação foi salvo! 💜");
      }
    } catch (err) {
      triggerNotification("Plano salvo localmente (Modo Offline)!");
    }
  };

  const handleAddDiaryEntry = async (e) => {
    e.preventDefault();
    if (!formDiary.text.trim()) return;
    const newEntry = {
      date: todayStr,
      text: formDiary.text,
      prompt: formDiary.prompt
    };

    try {
      const response = await fetch('https://ancora-app-1.onrender.com/api/diary', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEntry)
      });
      if (response.ok) {
        await fetchAllData();
        setFormDiary({ text: '', prompt: 'O que aconteceu hoje?' });
        triggerNotification("Página de diário salva! 💜");
      }
    } catch (err) {
      setDiaryEntries([{ id: Date.now(), ...newEntry }, ...diaryEntries]);
      setFormDiary({ text: '', prompt: 'O que aconteceu hoje?' });
      triggerNotification("Página de diário salva localmente (Modo Offline)!");
    }
  };

  const handleStartSos = () => {
    setSosPhase('breath');
    setSosTimer(600);
    setBreathCounter(4);
    setBreathState('Inspire');
    setIsSosTimerRunning(false);
    setShowSos(true);
  };

  const handleBreathCompleteTransition = () => {
    setSosPhase('timer');
    setIsSosTimerRunning(true);
  };

  const handleSosOutcome = (status) => {
    setSosPostStatus(status);
    
    let titleStr = "Passei por um momento vulnerável";
    if (status === 'better') titleStr = "Superei uma crise de compulsão!";
    else if (status === 'equal') titleStr = "Resisti bravamente a um gatilho";

    setSmallVictories([
      {
        id: Date.now(),
        date: todayStr,
        title: titleStr,
        description: `Usei o suporte de 10 minutos para acolher minhas emoções. Status final: ${status === 'better' ? 'Melhor' : status === 'equal' ? 'Igual' : 'Ainda difícil'}.`,
        category: "Gatilho"
      },
      ...smallVictories
    ]);

    setTimeout(() => {
      setShowSos(false);
      setSosPostStatus(null);
      setSosPhase('breath');
    }, 1500);
  };

  const handleCreateChallenge = async (e) => {
    e.preventDefault();
    if (!newChallenge.title.trim()) return;
    
    const challengePayload = {
      title: newChallenge.title,
      startDate: todayStr,
      totalDays: parseInt(newChallenge.duration) || 15,
      currentDay: 1,
      description: newChallenge.description,
      checklist: newChallenge.items.map(item => ({
        text: item,
        completed: false
      }))
    };

    try {
      const response = await fetch('https://ancora-app-1.onrender.com/api/challenges', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(challengePayload)
      });

      if (response.ok) {
        await fetchAllData();
        setShowCreateChallenge(false);
        setNewChallenge({ title: '', duration: 15, description: '', items: ['Beber água', 'Fazer check-in'] });
        triggerNotification("Seu desafio personalizado foi salvo! 💜");
      }
    } catch (err) {
      const newC = {
        id: Date.now(),
        title: challengePayload.title,
        startDate: challengePayload.startDate,
        totalDays: challengePayload.totalDays,
        currentDay: 1,
        description: challengePayload.description,
        checklist: challengePayload.checklist.map((it, idx) => ({ id: Date.now() + idx, text: it.text, completed: false }))
      };
      setChallenges([newC, ...challenges]);
      setShowCreateChallenge(false);
      setNewChallenge({ title: '', duration: 15, description: '', items: ['Beber água', 'Fazer check-in'] });
      triggerNotification("Desafio salvo localmente (Modo Offline)!");
    }
  };

  const handleAddChallengeItem = () => {
    if (!newChallengeItemInput.trim()) return;
    setNewChallenge(prev => ({
      ...prev,
      items: [...prev.items, newChallengeItemInput.trim()]
    }));
    setNewChallengeItemInput('');
  };

  const handleRemoveChallengeItem = (index) => {
    setNewChallenge(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const applyTemplate = (title, duration, description, items) => {
    setNewChallenge({
      title,
      duration,
      description,
      items
    });
  };

  const getDayStatusColor = (dayDateStr) => {
    const hasEpisode = episodes.some(e => e.date === dayDateStr);
    if (hasEpisode) return 'bg-[#9F86FF] text-white'; 
    
    const check = checkIns.find(c => c.date === dayDateStr);
    if (!check) return 'bg-gray-100 text-gray-400'; 
    
    if (check.urge >= 6) return 'bg-[#FFD6E8] text-[#9F86FF] font-medium border border-pink-300'; 
    return 'bg-[#EDE7F6] text-[#9F86FF] font-medium'; 
  };

  const handleSaveDayDesc = async (day) => {
    try {
      await fetch('https://ancora-app-1.onrender.com/api/training/days', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dia_semana: day, descricao: tempDayDesc })
      });
      setTrainingDays({ ...trainingDays, [day]: tempDayDesc });
      setEditingDay(null);
      triggerNotification("Descrição atualizada! 🏋️‍♀️");
    } catch (err) {
      setTrainingDays({ ...trainingDays, [day]: tempDayDesc });
      setEditingDay(null);
      triggerNotification("Descrição atualizada localmente!");
    }
  };

  const handleAddExercise = async (day) => {
    if (!newExercise.name.trim()) return;
    
    const currentList = exercises[day] || [];
    const newOrder = currentList.length > 0 ? Math.max(...currentList.map(e => e.ordem)) + 1 : 0;
    const payload = { dia_semana: day, nome: newExercise.name, ordem: newOrder };

    try {
      const res = await fetch('https://ancora-app-1.onrender.com/api/training/exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      setExercises({
        ...exercises,
        [day]: [...currentList, { id: data.id, ...payload }]
      });
      setNewExercise({ day: null, name: '' });
    } catch (err) {
      setExercises({
        ...exercises,
        [day]: [...currentList, { id: Date.now(), ...payload }]
      });
      setNewExercise({ day: null, name: '' });
    }
  };

  const handleDeleteExercise = async (day, id) => {
    try {
      await fetch(`https://ancora-app-1.onrender.com/api/training/exercises/${id}`, { method: 'DELETE' });
      setExercises({
        ...exercises,
        [day]: exercises[day].filter(e => e.id !== id)
      });
    } catch (err) {
      setExercises({
        ...exercises,
        [day]: exercises[day].filter(e => e.id !== id)
      });
    }
  };

  const handleMoveExercise = async (day, index, direction) => {
    const list = [...(exercises[day] || [])];
    if (direction === 'up' && index > 0) {
      [list[index - 1], list[index]] = [list[index], list[index - 1]];
    } else if (direction === 'down' && index < list.length - 1) {
      [list[index], list[index + 1]] = [list[index + 1], list[index]];
    } else {
      return; // Movimento inválido
    }

    // Atualiza a propriedade 'ordem' com base na nova posição do array
    const updatedList = list.map((ex, idx) => ({ ...ex, ordem: idx }));
    
    setExercises({ ...exercises, [day]: updatedList });

    try {
      await fetch('https://ancora-app-1.onrender.com/api/training/exercises/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: updatedList.map(e => ({ id: e.id, ordem: e.ordem })) })
      });
    } catch (err) {
      console.warn("Reordenação guardada localmente.");
    }
  };

  // --- HANDLERS: REFEIÇÕES ---
  const handleAddMeal = async (type) => {
    if (!newMealItem.name.trim()) return;
    const payload = { tipo_refeicao: type, nome: newMealItem.name, quantidade: newMealItem.amount };
    try {
      const res = await fetch('https://ancora-app-1.onrender.com/api/meals', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      const data = await res.json();
      setMeals({ ...meals, [type]: [...(meals[type] || []), { id: data.id, ...payload }] });
      setNewMealItem({ type: null, name: '', amount: '' });
    } catch (err) {
      setMeals({ ...meals, [type]: [...(meals[type] || []), { id: Date.now(), ...payload }] });
      setNewMealItem({ type: null, name: '', amount: '' });
    }
  };

  const handleEditMeal = async (type, id) => {
    try {
      await fetch(`https://ancora-app-1.onrender.com/api/meals/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nome: editingMeal.name, quantidade: editingMeal.amount })
      });
      setMeals({
        ...meals, [type]: meals[type].map(m => m.id === id ? { ...m, nome: editingMeal.name, quantidade: editingMeal.amount } : m)
      });
      setEditingMeal(null);
    } catch (err) {}
  };

  const handleDeleteMeal = async (type, id) => {
    try {
      await fetch(`https://ancora-app-1.onrender.com/api/meals/${id}`, { method: 'DELETE' });
      setMeals({ ...meals, [type]: meals[type].filter(m => m.id !== id) });
    } catch (err) {
      setMeals({ ...meals, [type]: meals[type].filter(m => m.id !== id) });
    }
  };

  // --- HANDLERS: COMPRAS ---
  const handleAddShoppingItem = async (e) => {
    e.preventDefault();
    if (!newShoppingItem.trim()) return;
    const payload = { nome: newShoppingItem };
    try {
      const res = await fetch('https://ancora-app-1.onrender.com/api/shopping', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      const data = await res.json();
      setShoppingList([{ id: data.id, nome: payload.nome, concluido: 0 }, ...shoppingList]);
      setNewShoppingItem('');
    } catch (err) {
      setShoppingList([{ id: Date.now(), nome: payload.nome, concluido: 0 }, ...shoppingList]);
      setNewShoppingItem('');
    }
  };

  const handleToggleShoppingItem = async (id, currentStatus) => {
    const newStatus = currentStatus ? 0 : 1;
    setShoppingList(shoppingList.map(item => item.id === id ? { ...item, concluido: newStatus } : item));
    try {
      await fetch(`https://ancora-app-1.onrender.com/api/shopping/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ concluido: newStatus })
      });
    } catch (err) {}
  };

  const handleDeleteShoppingItem = async (id) => {
    setShoppingList(shoppingList.filter(item => item.id !== id));
    try {
      await fetch(`https://ancora-app-1.onrender.com/api/shopping/${id}`, { method: 'DELETE' });
    } catch (err) {}
  };

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${theme === 'dark' ? 'bg-[#181622] text-[#F8F8FA]' : 'bg-[#F8F8FA] text-[#2C2638]'} pb-24`}>
      
      {/* BANNER DE INFORMAÇÃO DE CONEXÃO AO MYSQL */}
      <div className={`text-center py-1 text-[10px] font-bold transition-all duration-300 ${
        dbStatus === 'connected' 
          ? 'bg-emerald-50 text-emerald-600 border-b border-emerald-100' 
          : dbStatus === 'connecting'
          ? 'bg-[#EDE7F6] text-[#9F86FF] border-b border-[#C8B6FF]/30'
          : 'bg-[#FFF3F8] text-[#9F86FF] border-b border-pink-100'
      }`}>
        {dbStatus === 'connected' && "● Sincronizado ao banco 💜"}
        {dbStatus === 'connecting' && "Sincronizando com banco..."}
        {dbStatus === 'offline' && "Utilizando Armazenamento em Estado Local (Modo Simulação)"}
      </div>

      {/* SUCCESS TOAST NOTIFICATION */}
      {showSuccessToast && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-[#2C2638] text-[#EDE7F6] text-xs font-semibold py-3 px-6 rounded-full shadow-lg border border-[#9F86FF]/30 flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-[#9F86FF] animate-ping"></span>
          <span>{showSuccessToast}</span>
        </div>
      )}

      {/* HEADER BAR */}
      <header className={`sticky top-0 z-40 backdrop-blur-md border-b transition-all py-4 px-6 ${theme === 'dark' ? 'bg-[#181622]/80 border-[#2C2638]' : 'bg-white/80 border-[#EDE7F6]'}`}>
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#9F86FF] to-[#C8B6FF] flex items-center justify-center shadow-sm">
              <Heart className="w-4 h-4 text-white" fill="currentColor" />
            </div>
            <span className="font-semibold text-lg tracking-tight bg-gradient-to-r from-[#9F86FF] to-[#C8B6FF] bg-clip-text text-transparent">Âncora</span>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} 
              className={`p-2 rounded-full transition-all duration-200 hover:scale-105 ${theme === 'dark' ? 'bg-[#2C2638] text-[#C8B6FF]' : 'bg-[#EDE7F6] text-[#9F86FF]'}`}
              aria-label="Alternar tema"
            >
              <Sparkles className="w-4 h-4" />
            </button>
            <div className={`text-xs px-2.5 py-1 rounded-full font-medium ${theme === 'dark' ? 'bg-[#2D2244] text-[#C8B6FF]' : 'bg-[#EDE7F6] text-[#9F86FF]'}`}>
              {calculatedMetrics.currentStreak} Dias Estáveis
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-md mx-auto px-4 pt-6 space-y-6">

        {/* TAB 1: INÍCIO (HOME) */}
        {activeTab === 'inicio' && (
          <div className="space-y-6">
            <div>
              <p className="text-xs font-semibold tracking-wider text-[#9F86FF] uppercase">Bem-vinda de volta</p>
              <h1 className="text-2xl font-bold tracking-tight">Olá, {userName}.</h1>
              <p className="text-xs text-gray-500 mt-1">Como está seu autocuidado hoje?</p>
            </div>

            {/* Streak Dashboard Card */}
            <div className={`p-6 rounded-[24px] shadow-sm transition-all border relative ${theme === 'dark' ? 'bg-[#211D2F] border-[#2C2638]' : 'bg-white border-[#EDE7F6]'}`}>
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-semibold tracking-wide text-gray-400">Progresso do Mês</span>
                <div className="flex items-center space-x-2">
                  <span className="text-xs px-2.5 py-1 rounded-full bg-[#EDE7F6] text-[#9F86FF] font-medium">
                    Meta: {targetDays} dias
                  </span>
                  <button 
                    onClick={handleOpenStreakEditor} 
                    className="p-1 rounded-full text-gray-400 hover:text-[#9F86FF] transition-colors"
                    title="Editar dias sem compulsão"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {isEditingStreak && (
                <div className={`absolute inset-0 z-30 p-5 rounded-[24px] flex flex-col justify-center ${theme === 'dark' ? 'bg-[#211D2F]' : 'bg-white'}`}>
                  <form onSubmit={handleSaveCustomStreak} className="space-y-3">
                    <h4 className="text-xs font-bold text-[#9F86FF] uppercase tracking-wider">Ajustar Progresso de Maria</h4>
                    
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] text-gray-400 font-bold">Dias Atuais</label>
                        <input 
                          type="number" 
                          min="0"
                          value={tempCurrentStreak} 
                          onChange={(e) => setTempCurrentStreak(parseInt(e.target.value) || 0)}
                          className={`w-full p-2 text-xs rounded-lg border ${theme === 'dark' ? 'bg-[#181622] border-[#2C2638]' : 'bg-gray-50 border-gray-200'}`}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-400 font-bold">Maior Sequência</label>
                        <input 
                          type="number" 
                          min="0"
                          value={tempMaxStreak} 
                          onChange={(e) => setTempMaxStreak(parseInt(e.target.value) || 0)}
                          className={`w-full p-2 text-xs rounded-lg border ${theme === 'dark' ? 'bg-[#181622] border-[#2C2638]' : 'bg-gray-50 border-gray-200'}`}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-400 font-bold">Meta (Dias)</label>
                        <input 
                          type="number" 
                          min="1"
                          value={tempTargetDays} 
                          onChange={(e) => setTempTargetDays(parseInt(e.target.value) || 1)}
                          className={`w-full p-2 text-xs rounded-lg border ${theme === 'dark' ? 'bg-[#181622] border-[#2C2638]' : 'bg-gray-50 border-gray-200'}`}
                        />
                      </div>
                    </div>

                    <div className="flex space-x-2 pt-2 justify-end">
                      <button 
                        type="button" 
                        onClick={() => setIsEditingStreak(false)} 
                        className="px-3 py-1.5 text-xs text-gray-400 hover:text-gray-600 font-semibold"
                      >
                        Cancelar
                      </button>
                      <button 
                        type="submit" 
                        className="px-4 py-1.5 text-xs bg-[#9F86FF] hover:bg-[#8B70ED] text-white rounded-lg font-bold shadow-xs transition-all"
                      >
                        Salvar
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <div className="flex items-center justify-between space-x-4">
                <div className="relative flex items-center justify-center w-28 h-28">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="56" cy="56" r="48" stroke={theme === 'dark' ? '#2C2638' : '#F4EEFD'} strokeWidth="8" fill="transparent" />
                    <circle cx="56" cy="56" r="48" stroke="#9F86FF" strokeWidth="8" fill="transparent" 
                            strokeDasharray={2 * Math.PI * 48}
                            strokeDashoffset={2 * Math.PI * 48 * (1 - progressPercent / 100)}
                            strokeLinecap="round" />
                  </svg>
                  <div className="absolute text-center">
                    <span className="block text-2xl font-bold text-[#9F86FF]">{calculatedMetrics.currentStreak}</span>
                    <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">dias</span>
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  <p className="text-xs text-gray-500">Você está firme sem novos episódios de compulsão.</p>
                  <div className="pt-1">
                    <span className="text-xs text-gray-400 block">Maior sequência histórica:</span>
                    <span className="text-sm font-semibold text-[#C8B6FF]">{calculatedMetrics.maxStreak} dias</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quote of the Day Slider */}
            <div className={`p-5 rounded-[20px] transition-all text-center border italic ${theme === 'dark' ? 'bg-[#1D1B28] border-[#2C2638]' : 'bg-[#EDE7F6]/40 border-[#EDE7F6]'}`}>
              <p className="text-sm text-[#9F86FF] font-medium">
                "{quotes[currentQuoteIndex]}"
              </p>
            </div>

            {/* Active Challenge Progress Card */}
            {activeChallenge && (
              <div className={`p-5 rounded-[24px] border shadow-xs relative ${theme === 'dark' ? 'bg-[#211D2F] border-[#2C2638]' : 'bg-white border-[#EDE7F6]'}`}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="text-[10px] uppercase tracking-widest font-semibold text-[#9F86FF]">Desafio Ativo</span>
                    <h3 className="font-bold text-sm mt-0.5">{activeChallenge.title}</h3>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-[#9F86FF] font-bold">Dia {activeChallenge.currentDay} de {activeChallenge.totalDays}</span>
                    <button 
                      onClick={() => handleDeleteChallenge(activeChallenge.id)}
                      className="text-gray-400 hover:text-red-500 p-1 transition-colors rounded-full"
                      title="Excluir este desafio"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mb-3">{activeChallenge.description}</p>
                <div className="w-full bg-[#EDE7F6] h-2 rounded-full overflow-hidden">
                  <div className="bg-[#9F86FF] h-full" style={{ width: `${(activeChallenge.currentDay / activeChallenge.totalDays) * 100}%` }}></div>
                </div>
              </div>
            )}

            {/* Habit Checklist Section */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-sm text-[#9F86FF] tracking-wide uppercase">Hábitos de Hoje</h3>
                {activeChallenge && (
                  <span className="text-xs text-gray-400">
                    {activeChallenge.checklist.filter(h => h.completed).length} / {activeChallenge.checklist.length}
                  </span>
                )}
              </div>
              
              {activeChallenge ? (
                <div className="grid grid-cols-1 gap-2">
                  {activeChallenge.checklist.map((habit) => (
                    <div 
                      key={habit.id} 
                      onClick={() => handleToggleChallengeItem(activeChallenge.id, habit.id)}
                      className={`flex items-center justify-between p-3.5 rounded-[18px] border transition-all cursor-pointer ${
                        habit.completed 
                          ? (theme === 'dark' ? 'bg-[#241F35] border-[#9F86FF]/30' : 'bg-[#EDE7F6]/30 border-[#C8B6FF]') 
                          : (theme === 'dark' ? 'bg-[#211D2F] border-[#2C2638]' : 'bg-white border-[#EDE7F6]')
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-5.5 h-5.5 rounded-full flex items-center justify-center transition-all ${
                          habit.completed ? 'bg-[#9F86FF] text-white' : 'border-2 border-gray-300'
                        }`}>
                          {habit.completed && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <span className={`text-sm ${habit.completed ? 'line-through text-gray-400' : ''}`}>{habit.text}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center border border-dashed border-gray-200 rounded-[24px]">
                  <p className="text-xs text-gray-400 mb-3">Você não tem nenhum desafio ou checklist ativo de hábitos para hoje.</p>
                  <button
                    onClick={() => setActiveTab('desafios')}
                    className="inline-flex items-center space-x-1.5 text-xs font-bold text-[#9F86FF] bg-[#EDE7F6] hover:bg-[#C8B6FF] px-3.5 py-1.5 rounded-full transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Criar Desafio Personalizado</span>
                  </button>
                </div>
              )}
            </div>

            {/* Giant SOS Button */}
            <div className="pt-2">
              <button 
                onClick={handleStartSos}
                className="w-full bg-gradient-to-r from-[#9F86FF] to-[#C8B6FF] text-white py-4 px-6 rounded-[24px] font-semibold flex items-center justify-center space-x-3 shadow-md hover:opacity-95 transition-all transform active:scale-[0.98]"
              >
                <Heart className="w-5 h-5" fill="currentColor" />
                <span className="tracking-wide">Estou com vontade agora</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: CHECK-IN & HISTÓRICO */}
        {activeTab === 'checkin' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Check-in Diário</h1>
                <p className="text-xs text-gray-500 mt-1">Reserve 1 minuto para se conectar com suas emoções hoje.</p>
              </div>
              <button 
                onClick={() => setShowAddEpisode(!showAddEpisode)}
                className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${
                  showAddEpisode 
                    ? 'bg-gray-200 text-gray-600' 
                    : 'bg-[#EDE7F6] text-[#9F86FF] border border-[#C8B6FF]'
                }`}
              >
                {showAddEpisode ? "Cancelar" : "Registrar Episódio"}
              </button>
            </div>

            {showAddEpisode ? (
              <form onSubmit={handleAddEpisode} className={`p-5 rounded-[24px] border space-y-4 shadow-sm ${theme === 'dark' ? 'bg-[#211D2F] border-[#2C2638]' : 'bg-white border-[#EDE7F6]'}`}>
                <div className="p-3 bg-[#EDE7F6] rounded-[16px] text-center border border-[#C8B6FF]">
                  <p className="text-xs text-[#9F86FF] font-medium leading-relaxed">
                    "Obrigado por registrar. Isso não apaga todo o seu progresso."
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">Data</label>
                    <input 
                      type="date" 
                      value={formEpisode.date}
                      onChange={(e) => setFormEpisode({...formEpisode, date: e.target.value})}
                      className={`w-full p-2.5 rounded-[12px] text-xs border ${theme === 'dark' ? 'bg-[#181622] border-[#2C2638] text-white' : 'bg-[#F8F8FA] border-gray-200'}`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">Hora</label>
                    <input 
                      type="time" 
                      value={formEpisode.time}
                      onChange={(e) => setFormEpisode({...formEpisode, time: e.target.value})}
                      className={`w-full p-2.5 rounded-[12px] text-xs border ${theme === 'dark' ? 'bg-[#181622] border-[#2C2638] text-white' : 'bg-[#F8F8FA] border-gray-200'}`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Intensidade do impulso antes do episódio ({formEpisode.intensity}/10)</label>
                  <input 
                    type="range" 
                    min="1" 
                    max="10" 
                    value={formEpisode.intensity}
                    onChange={(e) => setFormEpisode({...formEpisode, intensity: parseInt(e.target.value)})}
                    className="w-full accent-[#9F86FF]"
                  />
                  <div className="flex justify-between text-[10px] text-gray-400">
                    <span>Brando</span>
                    <span>Moderado</span>
                    <span>Insuportável</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Quais foram os gatilhos?</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Ansiedade, solidão, cansaço, estresse..."
                    value={formEpisode.triggers}
                    onChange={(e) => setFormEpisode({...formEpisode, triggers: e.target.value})}
                    className={`w-full p-2.5 rounded-[12px] text-xs border ${theme === 'dark' ? 'bg-[#181622] border-[#2C2638] text-white' : 'bg-[#F8F8FA] border-gray-200'}`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">O que aconteceu? (sem julgamentos de peso ou calorias)</label>
                  <textarea 
                    placeholder="O que você estava sentindo naquele momento? O que gostaria de acolher?"
                    value={formEpisode.notes}
                    onChange={(e) => setFormEpisode({...formEpisode, notes: e.target.value})}
                    className={`w-full p-2.5 rounded-[12px] text-xs border h-20 resize-none ${theme === 'dark' ? 'bg-[#181622] border-[#2C2638] text-white' : 'bg-[#F8F8FA] border-gray-200'}`}
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full bg-[#9F86FF] hover:bg-[#8B70ED] text-white py-3 px-4 rounded-[16px] text-xs font-semibold transition-all transform active:scale-95"
                >
                  Salvar Registro Gentilmente
                </button>
              </form>
            ) : (
              <form onSubmit={handleAddCheckin} className={`p-5 rounded-[24px] border space-y-5 shadow-sm ${theme === 'dark' ? 'bg-[#211D2F] border-[#2C2638]' : 'bg-white border-[#EDE7F6]'}`}>
                {/* Mood Selection */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Como você está hoje? ({todayStr.split('-').reverse().join('/')})</label>
                  <div className="flex justify-between">
                    {[
                      { emoji: '😀', label: 'Radiante' },
                      { emoji: '😌', label: 'Tranquila' },
                      { emoji: '😐', label: 'Neutra' },
                      { emoji: '😔', label: 'Frágil' },
                      { emoji: '😭', label: 'Muito mal' }
                    ].map((item) => (
                      <button
                        type="button"
                        key={item.emoji}
                        onClick={() => setFormCheckin({...formCheckin, mood: item.emoji})}
                        className={`flex flex-col items-center p-2 rounded-[16px] transition-all w-16 ${
                          formCheckin.mood === item.emoji 
                            ? (theme === 'dark' ? 'bg-[#2E2842] scale-105 border border-[#9F86FF]/50' : 'bg-[#EDE7F6] scale-105 border border-[#C8B6FF]') 
                            : 'hover:bg-gray-100/50'
                        }`}
                      >
                        <span className="text-2xl">{item.emoji}</span>
                        <span className="text-[9px] mt-1 text-gray-400">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Urge Slider */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Nível de vontade de compulsão</label>
                    <span className="text-xs font-bold text-[#9F86FF]">{formCheckin.urge} / 10</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="10" 
                    value={formCheckin.urge}
                    onChange={(e) => setFormCheckin({...formCheckin, urge: parseInt(e.target.value)})}
                    className="w-full accent-[#9F86FF]"
                  />
                  <div className="flex justify-between text-[10px] text-gray-400">
                    <span>Nenhuma</span>
                    <span>Moderada</span>
                    <span>Muito forte</span>
                  </div>
                </div>

                {/* Grid Questions */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Comeu regularmente?</label>
                    <div className="flex flex-col space-y-1">
                      {['Sim', 'Mais ou menos', 'Não'].map((opt) => (
                        <button
                          type="button"
                          key={opt}
                          onClick={() => setFormCheckin({...formCheckin, eatRegular: opt})}
                          className={`p-2 rounded-[12px] text-xs font-medium text-left transition-all ${
                            formCheckin.eatRegular === opt 
                              ? 'bg-[#9F86FF] text-white' 
                              : (theme === 'dark' ? 'bg-[#181622] text-gray-300' : 'bg-gray-100 text-gray-600')
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Dormiu bem?</label>
                    <div className="flex flex-col space-y-1">
                      {['Sim', 'Não'].map((opt) => (
                        <button
                          type="button"
                          key={opt}
                          onClick={() => setFormCheckin({...formCheckin, sleepWell: opt})}
                          className={`p-2 rounded-[12px] text-xs font-medium text-left transition-all ${
                            formCheckin.sleepWell === opt 
                              ? 'bg-[#9F86FF] text-white' 
                              : (theme === 'dark' ? 'bg-[#181622] text-gray-300' : 'bg-gray-100 text-gray-600')
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Checklist Multi-select */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Como foi seu dia?</label>
                  <div className="flex flex-wrap gap-1.5">
                    {['Ansioso', 'Estressante', 'Cansativo', 'Tranquilo', 'Produtivo'].map((sym) => {
                      const active = formCheckin.symptoms.includes(sym);
                      return (
                        <button
                          type="button"
                          key={sym}
                          onClick={() => {
                            if (active) {
                              setFormCheckin({
                                ...formCheckin,
                                symptoms: formCheckin.symptoms.filter(s => s !== sym)
                              });
                            } else {
                              setFormCheckin({
                                ...formCheckin,
                                symptoms: [...formCheckin.symptoms, sym]
                              });
                            }
                          }}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                            active 
                              ? 'bg-[#EDE7F6] text-[#9F86FF] border border-[#C8B6FF]' 
                              : (theme === 'dark' ? 'bg-[#181622] text-gray-400 border border-[#2C2638]' : 'bg-white text-gray-500 border border-gray-200')
                          }`}
                        >
                          {sym}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Remarks/Notes */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Notas ou reflexões curtas</label>
                  <textarea 
                    placeholder="Como você se sente espiritualmente/emocionalmente agora?"
                    value={formCheckin.notes}
                    onChange={(e) => setFormCheckin({...formCheckin, notes: e.target.value})}
                    className={`w-full p-2.5 rounded-[12px] text-xs border h-16 resize-none ${theme === 'dark' ? 'bg-[#181622] border-[#2C2638] text-white' : 'bg-[#F8F8FA] border-gray-200'}`}
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full bg-gradient-to-r from-[#9F86FF] to-[#C8B6FF] hover:opacity-95 text-white py-3 px-4 rounded-[16px] font-semibold text-xs transition-all transform active:scale-95 shadow-sm"
                >
                  Salvar Check-In de Hoje ({todayStr.split('-').reverse().slice(0, 2).join('/')})
                </button>
              </form>
            )}

            {/* CALENDÁRIO COM HOVER TOOLTIP & ATUALIZAÇÃO AUTOMÁTICA DE DATAS */}
            <div className={`p-5 rounded-[24px] border ${theme === 'dark' ? 'bg-[#211D2F] border-[#2C2638]' : 'bg-white border-[#EDE7F6]'}`}>
              <h3 className="font-bold text-sm mb-3 text-[#9F86FF] uppercase tracking-widest text-[11px]">Calendário de Equilíbrio</h3>
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold">{calendarMeta.monthName} de {calendarMeta.year}</span>
                <span className="text-[10px] text-gray-400 font-semibold tracking-wide">Passe o mouse para ver detalhes</span>
              </div>

              <div className="grid grid-cols-7 gap-1.5 text-center mb-4 relative">
                {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((w, i) => (
                  <span key={i} className="text-[10px] font-bold text-gray-400">{w}</span>
                ))}
                {Array.from({ length: calendarMeta.startingDay }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-8"></div>
                ))}
                {Array.from({ length: calendarMeta.daysInMonth }).map((_, i) => {
                  const dayNum = i + 1;
                  const monthNumStr = String(calendarMeta.month + 1).padStart(2, '0');
                  const dayNumStr = String(dayNum).padStart(2, '0');
                  const dateStr = `${calendarMeta.year}-${monthNumStr}-${dayNumStr}`;
                  const styleColor = getDayStatusColor(dateStr);
                  const isToday = dayNum === calendarMeta.day;

                  const dayCheck = checkIns.find(c => c.date === dateStr);
                  const dayEp = episodes.filter(e => e.date === dateStr);

                  return (
                    <button
                      key={i}
                      type="button"
                      onMouseEnter={() => {
                        if (dayCheck || dayEp.length > 0) {
                          setHoveredDay({ date: dateStr, check: dayCheck, episodes: dayEp });
                        }
                      }}
                      onMouseLeave={() => setHoveredDay(null)}
                      onClick={() => {
                        setSelectedCalendarDay({ date: dateStr, check: dayCheck, episodes: dayEp });
                      }}
                      className={`h-8 w-8 rounded-full flex flex-col items-center justify-center text-xs relative ${styleColor} ${
                        isToday ? 'ring-2 ring-indigo-500 font-extrabold ring-offset-2' : ''
                      }`}
                    >
                      <span>{dayNum}</span>

                      {/* POP-UP / TOOLTIP INTERATIVO NO HOVER */}
                      {hoveredDay && hoveredDay.date === dateStr && (
                        <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 z-50 bg-[#2C2638] text-[#EDE7F6] text-left text-[11px] p-3 rounded-xl shadow-xl w-64 pointer-events-none border border-[#9F86FF]/30 leading-relaxed">
                          <span className="font-bold text-[#C8B6FF] block mb-1">Registro de {dateStr.split('-').reverse().join('/')}:</span>
                          {hoveredDay.check && (
                            <div className="mb-1">
                              <p>• Humor: {hoveredDay.check.mood}</p>
                              <p>• Impulso: {hoveredDay.check.urge}/10</p>
                              {hoveredDay.check.notes && <p className="italic text-gray-300 mt-1">"{hoveredDay.check.notes}"</p>}
                            </div>
                          )}
                          {hoveredDay.episodes.map((ep, idx) => (
                            <div key={idx} className="border-t border-white/10 pt-1 mt-1 text-red-300">
                              <p className="font-bold">⚠️ Crise ({ep.time})</p>
                              <p>• Gatilhos: {ep.triggers}</p>
                              {ep.notes && <p className="italic text-gray-300 mt-0.5">"{ep.notes}"</p>}
                            </div>
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center border-t border-gray-100 pt-3 text-[10px] text-gray-500">
                <div className="flex items-center space-x-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#EDE7F6] border border-[#C8B6FF]"></div>
                  <span>Dia Estável</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FFD6E8] border border-pink-300"></div>
                  <span>Dia Difícil (Vontade)</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#9F86FF]"></div>
                  <span>Episódio</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-gray-100 border border-gray-200"></div>
                  <span>Sem Registro</span>
                </div>
              </div>
            </div>

            {/* HISTÓRICO TEMPORAL DE CRISES E PROGRESSO */}
            <div className={`p-5 rounded-[24px] border ${theme === 'dark' ? 'bg-[#211D2F] border-[#2C2638]' : 'bg-white border-[#EDE7F6]'}`}>
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-[#9F86FF]" />
                <h3 className="font-bold text-sm text-[#9F86FF] uppercase tracking-widest text-[11px]">Progressão Temporal e Histórico</h3>
              </div>
              <p className="text-xs text-gray-400 mb-4">Acompanhe visualmente a linha do tempo das suas crises alimentares para identificar gatilhos e evolução:</p>

              {episodes.length === 0 ? (
                <div className="p-4 text-center border border-dashed border-gray-200 rounded-xl">
                  <p className="text-xs text-gray-400 italic">Nenhum episódio crítico registrado. Continue assim! 🤍</p>
                </div>
              ) : (
                <div className="space-y-4 relative border-l border-[#C8B6FF]/30 ml-2 pl-4">
                  {[...episodes].sort((a, b) => new Date(b.date + 'T' + b.time) - new Date(a.date + 'T' + a.time)).map((ep) => (
                    <div key={ep.id || Math.random()} className="relative space-y-1">
                      {/* Indicador Temporal */}
                      <div className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-[#9F86FF] border border-white dark:border-[#211D2F]"></div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-gray-400">{ep.date.split('T')[0].split('-').reverse().join('/')} às {ep.time}</span>
                        <span className="text-[9px] bg-red-50 dark:bg-red-950/20 text-[#9F86FF] px-2 py-0.5 rounded-full font-bold">Impulso: {ep.intensity}/10</span>
                      </div>
                      <div className="p-3.5 bg-gray-50 dark:bg-[#181622] rounded-xl text-xs space-y-1 border border-gray-100/50 dark:border-[#2C2638]">
                        <p className="font-semibold text-slate-700 dark:text-gray-300">Gatilho: <span className="font-medium text-[#9F86FF]">{ep.triggers}</span></p>
                        {ep.notes && <p className="text-gray-500 dark:text-gray-400 italic leading-relaxed mt-1">"{ep.notes}"</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Selected day visual log details */}
            {selectedCalendarDay && (
              <div className={`p-4 rounded-[20px] border relative animate-fadeIn ${theme === 'dark' ? 'bg-[#1D1B28] border-[#2C2638]' : 'bg-gray-50 border-gray-200'}`}>
                <button onClick={() => setSelectedCalendarDay(null)} className="absolute top-3 right-3 text-gray-400"><X className="w-4 h-4" /></button>
                <h4 className="text-xs font-bold text-gray-400 mb-2 uppercase">Detalhes: {selectedCalendarDay.date.split('-').reverse().join('/')}</h4>
                {!selectedCalendarDay.check && selectedCalendarDay.episodes.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">Sem registros neste dia.</p>
                ) : (
                  <div className="space-y-2 text-xs">
                    {selectedCalendarDay.check && (
                      <div>
                        <p>• Humor: <span className="font-semibold">{selectedCalendarDay.check.mood}</span></p>
                        <p>• Impulso: <span className="font-semibold">{selectedCalendarDay.check.urge}/10</span></p>
                        <p>• Regularidade: <span className="font-semibold">{selectedCalendarDay.check.eatRegular}</span></p>
                        {selectedCalendarDay.check.notes && <p className="italic text-gray-500">"{selectedCalendarDay.check.notes}"</p>}
                      </div>
                    )}
                    {selectedCalendarDay.episodes.map(ep => (
                      <div key={ep.id || Math.random()} className="p-2 bg-red-50 dark:bg-red-950/20 rounded-lg text-red-600">
                        <span className="font-bold">Episódio ({ep.time})</span>
                        <p>Gatilho: {ep.triggers}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: DESAFIOS */}
        {activeTab === 'desafios' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Desafios Gentis</h1>
                <p className="text-xs text-gray-500 mt-1">Construa novos hábitos sem pressa, no seu próprio ritmo.</p>
              </div>
              <button 
                onClick={() => setShowCreateChallenge(!showCreateChallenge)}
                className="bg-[#9F86FF] hover:bg-[#8B70ED] text-white p-2.5 rounded-full transition-all hover:scale-105 active:scale-95 shadow-sm"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {showCreateChallenge ? (
              <form onSubmit={handleCreateChallenge} className={`p-5 rounded-[24px] border space-y-4 shadow-sm ${theme === 'dark' ? 'bg-[#211D2F] border-[#2C2638]' : 'bg-white border-[#EDE7F6]'}`}>
                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                  <h3 className="font-bold text-sm">Criar Novo Desafio</h3>
                  <button type="button" onClick={() => setShowCreateChallenge(false)} className="text-gray-400"><X className="w-4 h-4" /></button>
                </div>

                <div>
                  <span className="block text-[10px] text-gray-400 font-bold uppercase mb-1">Modelos Rápidos</span>
                  <div className="flex flex-wrap gap-1">
                    {[
                      { title: "Volta à Rotina", duration: 7, desc: "Focar em retomar refeições em horários regulares.", items: ["Almoçar no horário", "Não pular lanches", "Beber 2L de água"] },
                      { title: "Autocuidado", duration: 15, desc: "Pequenos atos de carinho com você mesma diariamente.", items: ["beber 1.5 litros de água", "fazer 20 minutos de exercício físico", "Deitar até 23h30"] },
                      { title: "Menos Culpa", duration: 21, desc: "Acolhimento após deslizes, sem castigos alimentares.", items: ["Escrever no diário", "Caminhar ao ar livre", "Comer devagar"] }
                    ].map((tpl) => (
                      <button
                        key={tpl.title}
                        type="button"
                        onClick={() => applyTemplate(tpl.title, tpl.duration, tpl.desc, tpl.items)}
                        className="text-[10px] bg-[#EDE7F6] text-[#9F86FF] font-medium px-2 py-1 rounded-full hover:bg-[#C8B6FF] transition-all"
                      >
                        {tpl.title}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Nome do Desafio</label>
                  <input 
                    type="text" 
                    placeholder="Ex: 15 Dias de Conexão Emocional"
                    value={newChallenge.title}
                    onChange={(e) => setNewChallenge({...newChallenge, title: e.target.value})}
                    className={`w-full p-2.5 rounded-[12px] text-xs border ${theme === 'dark' ? 'bg-[#181622] border-[#2C2638] text-white' : 'bg-[#F8F8FA] border-gray-200'}`}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">Duração (Dias)</label>
                    <input 
                      type="number" 
                      min="3" 
                      max="100"
                      value={newChallenge.duration}
                      onChange={(e) => setNewChallenge({...newChallenge, duration: e.target.value})}
                      className={`w-full p-2.5 rounded-[12px] text-xs border ${theme === 'dark' ? 'bg-[#181622] border-[#2C2638] text-white' : 'bg-[#F8F8FA] border-gray-200'}`}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">Foco / Descrição</label>
                    <input 
                      type="text" 
                      placeholder="Ex: Comer devagar e sem telas"
                      value={newChallenge.description}
                      onChange={(e) => setNewChallenge({...newChallenge, description: e.target.value})}
                      className={`w-full p-2.5 rounded-[12px] text-xs border ${theme === 'dark' ? 'bg-[#181622] border-[#2C2638] text-white' : 'bg-[#F8F8FA] border-gray-200'}`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Itens de Checklist do Desafio</label>
                  <div className="flex space-x-2 mb-2">
                    <input 
                      type="text" 
                      placeholder="Adicionar tarefa..."
                      value={newChallengeItemInput}
                      onChange={(e) => setNewChallengeItemInput(e.target.value)}
                      className={`flex-1 p-2 rounded-[10px] text-xs border ${theme === 'dark' ? 'bg-[#181622] border-[#2C2638] text-white' : 'bg-[#F8F8FA] border-gray-200'}`}
                    />
                    <button 
                      type="button" 
                      onClick={handleAddChallengeItem}
                      className="bg-[#C8B6FF] hover:bg-[#9F86FF] text-white px-3 py-1.5 rounded-[10px] text-xs font-bold transition-all"
                    >
                      +
                    </button>
                  </div>
                  
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    {newChallenge.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs p-1.5 bg-gray-50 rounded-lg">
                        <span>• {it}</span>
                        <button type="button" onClick={() => handleRemoveChallengeItem(idx)} className="text-gray-400 hover:text-red-400">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-[#9F86FF] hover:bg-[#8B70ED] text-white py-3 px-4 rounded-[16px] text-xs font-semibold transition-all shadow-xs"
                >
                  Salvar Novo Desafio
                </button>
              </form>
            ) : null}

            <div className="space-y-4">
              {challenges.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-gray-200 rounded-[24px]">
                  <p className="text-sm text-gray-400">Você não possui desafios ativos.</p>
                  <p className="text-xs text-gray-400 mt-1">Clique no botão "+" acima para criar o seu desafio personalizado!</p>
                </div>
              ) : (
                challenges.map((c) => {
                  const totalItems = c.checklist.length;
                  const completedItems = c.checklist.filter(it => it.completed).length;
                  const percentDone = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

                  return (
                    <div 
                      key={c.id} 
                      className={`p-5 rounded-[24px] border shadow-xs transition-all ${
                        theme === 'dark' ? 'bg-[#211D2F] border-[#2C2638]' : 'bg-white border-[#EDE7F6]'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-[#9F86FF] tracking-wider">Desafio Ativo</span>
                          <h3 className="font-bold text-base mt-0.5">{c.title}</h3>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-[#9F86FF]">Dia {c.currentDay} de {c.totalDays}</span>
                          <button 
                            onClick={() => handleDeleteChallenge(c.id)}
                            className="p-1.5 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
                            title="Excluir este desafio para criar o seu"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-gray-500 mb-4">{c.description}</p>

                      <div className="space-y-1 mb-4">
                        <div className="flex justify-between text-[10px] text-gray-400">
                          <span>Progresso Diário</span>
                          <span>{completedItems} de {totalItems} concluídos</span>
                        </div>
                        <div className="w-full bg-[#EDE7F6] h-2.5 rounded-full overflow-hidden">
                          <div className="bg-[#9F86FF] h-full transition-all duration-300" style={{ width: `${percentDone}%` }}></div>
                        </div>
                      </div>

                      <div className="space-y-2 border-t border-gray-100 pt-3">
                        <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Checklist do Dia</span>
                        {c.checklist.map((item) => (
                          <div 
                            key={item.id}
                            onClick={() => handleToggleChallengeItem(c.id, item.id)}
                            className={`flex items-center justify-between p-2.5 rounded-[14px] cursor-pointer border transition-all ${
                              item.completed 
                                ? (theme === 'dark' ? 'bg-[#241F35] border-[#9F86FF]/30 text-gray-400' : 'bg-[#EDE7F6]/40 border-[#C8B6FF]/50 text-gray-400') 
                                : (theme === 'dark' ? 'bg-[#181622] border-[#2C2638]' : 'bg-gray-50 border-gray-200')
                            }`}
                          >
                            <div className="flex items-center space-x-2.5">
                              <div className={`w-4.5 h-4.5 rounded-full flex items-center justify-center transition-all ${
                                item.completed ? 'bg-[#9F86FF] text-white' : 'border border-gray-300'
                              }`}>
                                {item.completed && <Check className="w-3.5 h-3.5" />}
                              </div>
                              <span className={`text-xs ${item.completed ? 'line-through' : ''}`}>{item.text}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 4: TREINO */}
        {activeTab === 'treino' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Organização de Treinos</h1>
              <p className="text-xs text-gray-500 mt-1">Configure sua rotina semanal.</p>
            </div>

            <div className="space-y-5">
              {diasDaSemana.map((day) => {
                const dayExercises = exercises[day] || [];
                const currentDesc = trainingDays[day] || '';

                return (
                  <div key={day} className={`p-4 rounded-[20px] border shadow-sm transition-all ${theme === 'dark' ? 'bg-[#211D2F] border-[#2C2638]' : 'bg-white border-[#EDE7F6]'}`}>
                    
                    {/* Cabeçalho do Dia */}
                    <div className={`flex flex-col mb-4 border-b pb-3 ${theme === 'dark' ? 'border-[#2C2638]' : 'border-[#EDE7F6]'}`}>
                      <h3 className="font-bold text-sm text-[#9F86FF] uppercase tracking-wider mb-1">{day}</h3>
                      
                      {editingDay === day ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            placeholder="Ex: Glúteos e Posterior..."
                            value={tempDayDesc}
                            onChange={(e) => setTempDayDesc(e.target.value)}
                            className={`flex-1 p-1.5 rounded-md text-xs border ${theme === 'dark' ? 'bg-[#181622] border-[#2C2638] text-white' : 'bg-[#F8F8FA] border-gray-200'}`}
                            autoFocus
                          />
                          <button onClick={() => handleSaveDayDesc(day)} className="text-emerald-500 hover:text-emerald-600 p-1">
                            <Save className="w-4 h-4" />
                          </button>
                          <button onClick={() => setEditingDay(null)} className="text-gray-400 p-1">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between group">
                          <span className={`text-xs font-semibold ${currentDesc ? (theme === 'dark' ? 'text-gray-200' : 'text-gray-700') : 'text-gray-400 italic'}`}>
                            {currentDesc || 'Sem foco definido'}
                          </span>
                          <button 
                            onClick={() => {
                              setEditingDay(day);
                              setTempDayDesc(currentDesc);
                            }} 
                            className="text-gray-400 hover:text-[#9F86FF] transition-colors p-1"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Lista de Exercícios */}
                    <div className="space-y-2 mb-3">
                      {dayExercises.length === 0 ? (
                        <p className="text-[11px] text-gray-400 text-center py-2">Nenhum exercício adicionado.</p>
                      ) : (
                        dayExercises.map((ex, index) => (
                          <div key={ex.id} className={`flex items-center justify-between p-2.5 rounded-xl border ${theme === 'dark' ? 'bg-[#181622] border-[#2C2638]' : 'bg-gray-50 border-gray-200'}`}>
                            <span className="text-xs font-medium pl-1">{ex.nome}</span>
                            <div className="flex items-center space-x-1">
                              {/* Setas de Reordenação */}
                              <div className="flex flex-col mr-1">
                                <button 
                                  disabled={index === 0} 
                                  onClick={() => handleMoveExercise(day, index, 'up')}
                                  className="text-gray-400 hover:text-[#9F86FF] disabled:opacity-30"
                                >
                                  <ArrowUp className="w-3 h-3" />
                                </button>
                                <button 
                                  disabled={index === dayExercises.length - 1} 
                                  onClick={() => handleMoveExercise(day, index, 'down')}
                                  className="text-gray-400 hover:text-[#9F86FF] disabled:opacity-30"
                                >
                                  <ArrowDown className="w-3 h-3" />
                                </button>
                              </div>
                              {/* Excluir */}
                              <button onClick={() => handleDeleteExercise(day, ex.id)} className="p-1.5 text-gray-400 hover:text-red-400 transition-colors">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Adicionar Novo Exercício */}
                    {newExercise.day === day ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          placeholder="Nome do exercício..."
                          value={newExercise.name}
                          onChange={(e) => setNewExercise({ ...newExercise, name: e.target.value })}
                          className={`flex-1 p-2 rounded-[10px] text-xs border ${theme === 'dark' ? 'bg-[#181622] border-[#2C2638] text-white' : 'bg-white border-[#C8B6FF]'}`}
                          autoFocus
                          onKeyDown={(e) => e.key === 'Enter' && handleAddExercise(day)}
                        />
                        <button onClick={() => handleAddExercise(day)} className="bg-[#9F86FF] text-white p-2 rounded-[10px]">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => setNewExercise({ day: null, name: '' })} className="bg-gray-200 text-gray-500 dark:bg-[#2C2638] p-2 rounded-[10px]">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setNewExercise({ day: day, name: '' })}
                        className={`w-full py-2 flex items-center justify-center space-x-1 text-[11px] font-bold text-[#9F86FF] transition-colors rounded-xl ${theme === 'dark' ? 'bg-[#2C2638] hover:bg-[#3D3554]' : 'bg-[#EDE7F6] hover:bg-[#C8B6FF] hover:text-white'}`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Adicionar Exercício</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 5: ALIMENTAÇÃO */}
        {activeTab === 'alimentacao' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Alimentação</h1>
              <p className="text-xs text-gray-500 mt-1">Organize suas refeições e não esqueça nada no mercado.</p>
            </div>

            {/* SEÇÃO 1: PLANEJAMENTO DE REFEIÇÕES */}
            <div className="space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#9F86FF] mb-2">Planejamento Diário</h2>
              
              {mealTypes.map(type => {
                const currentMeals = meals[type] || [];
                return (
                  <div key={type} className={`p-4 rounded-[20px] border shadow-sm transition-all ${theme === 'dark' ? 'bg-[#211D2F] border-[#2C2638]' : 'bg-white border-[#EDE7F6]'}`}>
                    <h3 className={`font-bold text-sm uppercase tracking-wider mb-3 pb-2 border-b ${theme === 'dark' ? 'border-[#2C2638] text-gray-200' : 'border-[#EDE7F6] text-gray-700'}`}>
                      {type}
                    </h3>
                    
                    <div className="space-y-2 mb-3">
                      {currentMeals.length === 0 ? (
                        <p className="text-[11px] text-gray-400 italic py-1">Nenhum alimento adicionado.</p>
                      ) : (
                        currentMeals.map((m) => (
                          <div key={m.id}>
                            {editingMeal?.id === m.id ? (
                              <div className="flex items-center space-x-2 mt-1">
                                <input
                                  type="text"
                                  value={editingMeal.name}
                                  onChange={(e) => setEditingMeal({ ...editingMeal, name: e.target.value })}
                                  className={`flex-1 p-2 rounded-lg text-xs border ${theme === 'dark' ? 'bg-[#181622] border-[#2C2638] text-white' : 'bg-[#F8F8FA] border-gray-200'}`}
                                />
                                <input
                                  type="text"
                                  value={editingMeal.amount}
                                  onChange={(e) => setEditingMeal({ ...editingMeal, amount: e.target.value })}
                                  className={`w-20 p-2 rounded-lg text-xs border ${theme === 'dark' ? 'bg-[#181622] border-[#2C2638] text-white' : 'bg-[#F8F8FA] border-gray-200'}`}
                                />
                                <button onClick={() => handleEditMeal(type, m.id)} className="text-emerald-500 hover:text-emerald-600 p-1"><Save className="w-4 h-4" /></button>
                                <button onClick={() => setEditingMeal(null)} className="text-gray-400 hover:text-red-400 p-1"><X className="w-4 h-4" /></button>
                              </div>
                            ) : (
                              <div className={`flex items-center justify-between p-2.5 rounded-xl border ${theme === 'dark' ? 'bg-[#181622] border-[#2C2638]' : 'bg-gray-50 border-gray-200'}`}>
                                <div className="flex items-center space-x-2 overflow-hidden">
                                  <span className="text-xs font-medium">{m.nome}</span>
                                  {m.quantidade && <span className="text-[10px] text-gray-400 bg-gray-200/50 dark:bg-white/5 px-2 py-0.5 rounded-full">{m.quantidade}</span>}
                                </div>
                                <div className="flex items-center space-x-1 pl-2">
                                  <button onClick={() => setEditingMeal({ id: m.id, name: m.nome, amount: m.quantidade, type })} className="p-1.5 text-gray-400 hover:text-[#9F86FF] transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                                  <button onClick={() => handleDeleteMeal(type, m.id)} className="p-1.5 text-gray-400 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>

                    {newMealItem.type === type ? (
                      <div className="flex items-center space-x-2 pt-1 border-t border-dashed border-[#EDE7F6] dark:border-[#2C2638] mt-2">
                        <input
                          type="text" placeholder="Alimento..." value={newMealItem.name}
                          onChange={(e) => setNewMealItem({ ...newMealItem, name: e.target.value })}
                          className={`flex-1 p-2 rounded-[10px] text-xs border ${theme === 'dark' ? 'bg-[#181622] border-[#2C2638] text-white' : 'bg-white border-[#C8B6FF]'}`}
                          autoFocus
                        />
                        <input
                          type="text" placeholder="Qtd..." value={newMealItem.amount}
                          onChange={(e) => setNewMealItem({ ...newMealItem, amount: e.target.value })}
                          className={`w-20 p-2 rounded-[10px] text-xs border ${theme === 'dark' ? 'bg-[#181622] border-[#2C2638] text-white' : 'bg-white border-[#C8B6FF]'}`}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddMeal(type)}
                        />
                        <button onClick={() => handleAddMeal(type)} className="bg-[#9F86FF] text-white p-2 rounded-[10px]"><Check className="w-4 h-4" /></button>
                        <button onClick={() => setNewMealItem({ type: null, name: '', amount: '' })} className={`p-2 rounded-[10px] ${theme === 'dark' ? 'bg-[#2C2638] text-gray-400' : 'bg-gray-200 text-gray-500'}`}><X className="w-4 h-4" /></button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setNewMealItem({ type: type, name: '', amount: '' })}
                        className={`w-full py-2 flex items-center justify-center space-x-1 text-[11px] font-bold text-[#9F86FF] transition-colors rounded-xl ${theme === 'dark' ? 'bg-[#2C2638] hover:bg-[#3D3554]' : 'bg-[#EDE7F6] hover:bg-[#C8B6FF] hover:text-white'}`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Adicionar Item</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* SEÇÃO 2: LISTA DE COMPRAS ESTILO GOOGLE KEEP */}
            <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-[#2C2638]">
              <div className="flex items-center space-x-2 mb-2">
                <ShoppingCart className="w-4 h-4 text-[#9F86FF]" />
                <h2 className="text-xs font-bold uppercase tracking-widest text-[#9F86FF]">Lista de Compras</h2>
              </div>

              {/* Caixa Rápida para Adicionar */}
              <form onSubmit={handleAddShoppingItem} className={`relative flex items-center border rounded-[16px] overflow-hidden shadow-sm transition-all focus-within:ring-2 ring-[#C8B6FF] ${theme === 'dark' ? 'bg-[#211D2F] border-[#2C2638]' : 'bg-white border-[#EDE7F6]'}`}>
                <Plus className="w-5 h-5 text-gray-400 absolute left-3" />
                <input
                  type="text"
                  placeholder="Adicionar item à lista..."
                  value={newShoppingItem}
                  onChange={(e) => setNewShoppingItem(e.target.value)}
                  className={`w-full py-3.5 pl-10 pr-4 text-sm bg-transparent outline-none ${theme === 'dark' ? 'text-white placeholder-gray-500' : 'text-gray-800 placeholder-gray-400'}`}
                />
              </form>

              {/* Itens Pendentes */}
              <div className="space-y-1">
                {shoppingList.filter(item => !item.concluido).map((item) => (
                  <div key={item.id} className="flex items-center justify-between group py-1.5 px-1">
                    <div className="flex items-center space-x-3 cursor-pointer flex-1" onClick={() => handleToggleShoppingItem(item.id, item.concluido)}>
                      <Circle className="w-5 h-5 text-gray-300 dark:text-gray-500 hover:text-[#9F86FF] transition-colors" />
                      <span className="text-sm font-medium">{item.nome}</span>
                    </div>
                    <button onClick={() => handleDeleteShoppingItem(item.id)} className="text-gray-300 hover:text-red-400 transition-colors p-1"><X className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>

              {/* Divisor de Itens Concluídos */}
              {shoppingList.some(item => item.concluido) && (
                <div className="pt-3">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className={`h-px flex-1 ${theme === 'dark' ? 'bg-[#2C2638]' : 'bg-gray-200'}`}></div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Concluídos</span>
                    <div className={`h-px flex-1 ${theme === 'dark' ? 'bg-[#2C2638]' : 'bg-gray-200'}`}></div>
                  </div>
                  
                  {/* Itens Concluídos (Estilo Tachado) */}
                  <div className="space-y-1 opacity-60">
                    {shoppingList.filter(item => item.concluido).map((item) => (
                      <div key={item.id} className="flex items-center justify-between py-1 px-1">
                        <div className="flex items-center space-x-3 cursor-pointer flex-1" onClick={() => handleToggleShoppingItem(item.id, item.concluido)}>
                          <CheckCircle2 className="w-5 h-5 text-[#9F86FF]" />
                          <span className="text-sm font-medium line-through text-gray-500">{item.nome}</span>
                        </div>
                        <button onClick={() => handleDeleteShoppingItem(item.id)} className="text-gray-300 hover:text-red-400 transition-colors p-1"><X className="w-4 h-4" /></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

      </main>

      {/* SOS PORTAL */}
      {showSos && (
        <div className="fixed inset-0 z-50 bg-[#14121F] text-white flex flex-col justify-between p-6">
          <div className="flex justify-between items-center max-w-md mx-auto w-full">
            <span className="text-xs font-bold uppercase tracking-widest text-[#C8B6FF]">Âncora SOS</span>
            <button onClick={() => setShowSos(false)} className="p-2 rounded-full bg-[#2C2638] text-gray-400"><X className="w-5 h-5" /></button>
          </div>

          {sosPhase === 'breath' && (
            <div className="text-center space-y-6 flex flex-col items-center max-w-md mx-auto">
              <h2 className="text-2xl font-black">Antes de tudo, respire.</h2>
              <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-[#9F86FF] to-[#C8B6FF] flex flex-col items-center justify-center shadow-lg">
                <span className="text-xs uppercase font-bold tracking-widest text-[#14121F]">{breathCounter}s</span>
                <span className="text-lg font-black">{breathState}</span>
              </div>
              <button onClick={handleBreathCompleteTransition} className="text-xs border border-white/20 px-4 py-2 rounded-full">Ir para o Timer</button>
            </div>
          )}

          {sosPhase === 'timer' && (
            <div className="text-center space-y-6 w-full flex flex-col items-center max-w-md mx-auto">
              <h2 className="text-xl font-bold">Você só precisa passar pelos próximos 10 minutos.</h2>
              <div className="text-5xl font-black tracking-wider text-[#9F86FF] font-mono">
                {Math.floor(sosTimer / 60)}:{(sosTimer % 60).toString().padStart(2, '0')}
              </div>
              <button onClick={() => setSimulateSpeed(!simulateSpeed)} className="text-[10px] bg-[#9F86FF] px-3 py-1 rounded-full text-white">
                {simulateSpeed ? "Velocidade Rápida Ativa" : "Acelerar para Teste"}
              </button>
              <button onClick={() => setIsSosTimerRunning(!isSosTimerRunning)} className="bg-white/10 px-4 py-2 rounded-full text-xs">
                {isSosTimerRunning ? "Pausar" : "Retomar"}
              </button>
            </div>
          )}

          {sosPhase === 'post' && (
            <div className="text-center space-y-6 flex flex-col items-center max-w-md mx-auto w-full">
              <h2 className="text-2xl font-black">Você conseguiu! Como você está agora?</h2>
              <div className="flex flex-col space-y-2 w-full max-w-xs">
                {['better', 'equal', 'hard'].map(id => (
                  <button key={id} onClick={() => handleSosOutcome(id)} className="p-3 bg-[#211D2F] rounded-xl text-xs font-bold text-center border border-white/10">
                    {id === 'better' ? '😊 Melhor' : id === 'equal' ? '😐 Igual' : '😔 Ainda difícil'}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="max-w-md mx-auto w-full text-center text-[10px] text-gray-500">"Cada minuto adiado é uma vitória enorme."</div>
        </div>
      )}

      {/* BOTTOM TAB BAR */}
      <nav className={`fixed bottom-0 left-0 right-0 z-40 border-t py-2 px-3 transition-colors duration-300 ${
        theme === 'dark' ? 'bg-[#181622] border-[#2C2638]' : 'bg-white border-gray-100'
      }`}>
        <div className="max-w-md mx-auto flex justify-between items-center">
          {[
            { id: 'inicio', label: 'Início', icon: Home },
            { id: 'checkin', label: 'Check-in', icon: Calendar },
            { id: 'desafios', label: 'Desafios', icon: Sparkles },
            { id: 'treino', label: 'Treinos', icon: Dumbbell },
            { id: 'alimentacao', label: 'Dieta', icon: Utensils },
            { id: 'apoio', label: 'Apoio', icon: Heart }
          ].map((tab) => {
            const ActiveIcon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex flex-col items-center justify-center flex-1 py-1 text-center transition-all duration-150"
              >
                <div className={`p-1.5 rounded-full transition-all ${
                  isActive 
                    ? 'bg-[#EDE7F6] text-[#9F86FF] scale-110' 
                    : 'text-gray-400 hover:text-[#9F86FF]'
                }`}>
                  <ActiveIcon className="w-5 h-5" />
                </div>
                <span className={`text-[9px] font-bold tracking-tight mt-0.5 ${
                  isActive ? 'text-[#9F86FF]' : 'text-gray-400'
                }`}>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

    </div>
  );
}