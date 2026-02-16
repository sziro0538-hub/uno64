// app/checkin/page.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import confetti from 'canvas-confetti';

interface Checkin {
  id: string;
  user_id: string;
  checkin_date: string;
  level: number | null;
  badge_id: number | null;
  created_at: string;
}

interface Badge {
  id: number;
  name: string;
  description: string;
  image_url: string;
  level_required: number;
  rarity: string;
}

interface UserBadge {
  badge: Badge;
  earned_at: string;
  level_earned: number;
}

interface SelectedBadge {
  position: number;
  badge: Badge;
}

export default function CheckinPage() {
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [testMode, setTestMode] = useState(true);
  
  const [currentLevel, setCurrentLevel] = useState(0);
  const [totalCheckins, setTotalCheckins] = useState(0);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [selectedBadges, setSelectedBadges] = useState<SelectedBadge[]>([]);
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [showBadgeAnimation, setShowBadgeAnimation] = useState(false);
  const [newBadge, setNewBadge] = useState<Badge | null>(null);
  const [userName, setUserName] = useState('User');

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getToken();
  }, []);

  async function getToken() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      setToken(session.access_token);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.user_metadata?.full_name) {
        setUserName(user.user_metadata.full_name);
      } else if (user?.email) {
        setUserName(user.email.split('@')[0]);
      }
      
      fetchCheckins(session.access_token);
    } else {
      setLoading(false);
      setMessage('❌ Потрібно увійти в систему');
    }
  }

  async function fetchCheckins(accessToken: string) {
    try {
      const response = await fetch('/api/checkin', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      const data = await response.json();
      
      if (response.ok) {
        setTotalCheckins(data.total_checkins || 0);
        setCurrentLevel(data.current_level || 0);
        setUserBadges(data.user_badges || []);
        setSelectedBadges(data.selected_badges || []);
        setAllBadges(data.all_badges || []);

        setTimeout(() => scrollToCurrentLevel(), 300);
      }
    } catch (error) {
      console.error('Помилка завантаження:', error);
    } finally {
      setLoading(false);
    }
  }

  function scrollToCurrentLevel() {
    if (scrollRef.current && currentLevel > 0) {
      // Центруємо поточний рівень
      const scrollPosition = Math.max(0, (currentLevel - 1) * 60 - 300);
      scrollRef.current.scrollTo({ left: scrollPosition, behavior: 'smooth' });
    }
  }

  function launchConfetti() {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: NodeJS.Timeout = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);
  }

  async function handleCheckin() {
    if (!token) {
      setMessage('❌ Потрібно увійти в систему');
      return;
    }

    setChecking(true);
    setMessage('');

    try {
      const response = await fetch('/api/checkin', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ force: testMode })
      });

      const data = await response.json();

      if (response.ok) {
        if (data.new_badge) {
          setNewBadge(data.new_badge);
          setShowBadgeAnimation(true);
          
          launchConfetti();
          
          setTimeout(() => {
            setShowBadgeAnimation(false);
          }, 3000);
          
          setMessage(`✅ Вітаємо! Отримано бейджик: ${data.new_badge.name}!`);
        } else {
          setMessage(`✅ Чекін успішний! Рівень: ${data.level}`);
        }
        
        await fetchCheckins(token);
        
        setTimeout(() => setMessage(''), 5000);
      } else {
        setMessage(`❌ ${data.error}`);
      }
    } catch (error) {
      setMessage('❌ Щось пішло не так');
      console.error('Помилка:', error);
    } finally {
      setChecking(false);
    }
  }

  async function selectBadge(badge: Badge) {
    if (!token) return;

    const hasBadge = userBadges.some(ub => ub.badge.id === badge.id);
    if (!hasBadge) {
      setMessage('❌ Ви ще не отримали цей бейджик');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    const alreadySelected = selectedBadges.some(sb => sb.badge.id === badge.id);
    if (alreadySelected) {
      setMessage('⚠️ Цей бейджик вже вибрано');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    let position = 1;
    while (position <= 5 && selectedBadges.some(sb => sb.position === position)) {
      position++;
    }

    if (position > 5) {
      setMessage('⚠️ Вже вибрано 5 бейджиків. Видаліть один, щоб додати новий');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser(token);
      if (!user) return;

      const { error } = await supabase
        .from('user_selected_badges')
        .insert([{
          user_id: user.id,
          badge_id: badge.id,
          position: position
        }]);

      if (error) {
        console.error('Error selecting badge:', error);
        setMessage('❌ Помилка вибору бейджика');
      } else {
        await fetchCheckins(token);
        setMessage('✅ Бейджик додано до профілю!');
      }
      
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error:', error);
    }
  }

  async function removeBadge(position: number) {
    if (!token) return;

    try {
      const { data: { user } } = await supabase.auth.getUser(token);
      if (!user) return;

      const { error } = await supabase
        .from('user_selected_badges')
        .delete()
        .eq('user_id', user.id)
        .eq('position', position);

      if (!error) {
        await fetchCheckins(token);
      }
    } catch (error) {
      console.error('Error removing badge:', error);
    }
  }

  const generateLevelScale = () => {
    const levels = [];
    // Додаємо відступи з обох боків
    const startPadding = 3;
    const endPadding = 3;
    
    const startLevel = Math.max(1, currentLevel - 10);
    const endLevel = Math.min(700, currentLevel + 15);
    
    for (let i = startLevel - startPadding; i <= endLevel + endPadding; i++) {
      if (i < 1 || i > 700) continue;
      
      const badge = allBadges.find(b => b.level_required === i);
      const isCompleted = i <= currentLevel;
      const isCurrent = i === currentLevel;
      
      levels.push({
        level: i,
        badge: badge || null,
        isCompleted,
        isCurrent
      });
    }
    return levels;
  };

  const levelScale = generateLevelScale();

  // Кількість бейджиків для відображення
  const badgesPerRow = 10;
  const initialRows = 2; // Завжди показуємо 2 ряди
  const [visibleBadges, setVisibleBadges] = useState(badgesPerRow * initialRows); // 20 бейджиків спочатку

  const displayedBadges = userBadges.slice(0, visibleBadges);
  const remainingBadges = userBadges.length - visibleBadges;
  const hasMoreBadges = remainingBadges > 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-600 mx-auto mb-4"></div>
          <div className="text-lg text-gray-600">Завантаження...</div>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
        <div className="bg-white p-8 rounded-2xl shadow-lg text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Потрібна авторизація</h2>
          <p className="text-gray-600">Будь ласка, увійдіть в систему</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        
        {testMode && (
          <div className="mb-4 flex items-center justify-center gap-3 p-3 bg-yellow-50 rounded-lg border-2 border-yellow-200">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={testMode}
                onChange={(e) => setTestMode(e.target.checked)}
                className="w-4 h-4 cursor-pointer"
              />
              <span className="font-medium text-yellow-800 text-sm">
                🧪 Тестовий режим
              </span>
            </label>
          </div>
        )}

        <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-8">
          
          {/* Анімація отримання бейджика */}
          {showBadgeAnimation && newBadge && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
              <div className="bg-white rounded-3xl p-12 text-center max-w-md animate-scale-in">
                <div className="text-7xl mb-4">🎉</div>
                <h3 className="text-3xl font-bold text-gray-800 mb-4">Nuevo Badge!</h3>
                <div className="w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden bg-gradient-to-br from-orange-200 to-red-200 flex items-center justify-center shadow-2xl">
                  <img 
                    src={newBadge.image_url} 
                    alt={newBadge.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      const parent = target.parentElement;
                      if (parent && parent.contains(target)) {
                        target.style.display = 'none';
                        const fallback = document.createElement('span');
                        fallback.className = 'text-5xl';
                        fallback.textContent = '🏆';
                        parent.appendChild(fallback);
                      }
                    }}
                  />
                </div>
                <p className="text-2xl font-bold text-orange-600 mb-2">{newBadge.name}</p>
                <p className="text-gray-600">{newBadge.description}</p>
                <p className="text-sm text-gray-500 mt-4">Nivel {newBadge.level_required}</p>
              </div>
            </div>
          )}

          {/* Заголовок */}
          <h1 className="text-3xl md:text-4xl font-bold mb-6 text-center italic text-gray-700">
            COLLECTA TODOS BADGES
          </h1>

          {/* Профіль користувача + вибрані бейджики */}
          <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <span className="text-lg font-semibold text-gray-800">{userName}</span>
              
              {/* 5 слотів для бейджиків */}
              <div className="flex gap-1 sm:gap-2">
                {[1, 2, 3, 4, 5].map(position => {
                  const selected = selectedBadges.find(sb => sb.position === position);
                  return (
                    <div
                      key={position}
                      onClick={() => selected && removeBadge(position)}
                      className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all overflow-hidden ${
                        selected 
                          ? 'border-orange-500 bg-gradient-to-br from-orange-200 to-red-200 hover:scale-110 shadow-lg' 
                          : 'border-gray-300 bg-gray-100'
                      }`}
                      title={selected ? `${selected.badge.name} (clic para eliminar)` : 'Slot vacío'}
                    >
                      {selected ? (
                        <img 
                          src={selected.badge.image_url} 
                          alt={selected.badge.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.onerror = null;
                            const parent = target.parentElement;
                            if (parent && parent.contains(target)) {
                              target.style.display = 'none';
                              const fallback = document.createElement('span');
                              fallback.className = 'text-sm sm:text-base md:text-xl';
                              fallback.textContent = '🏆';
                              parent.appendChild(fallback);
                            }
                          }}
                        />
                      ) : (
                        <span className="text-gray-400 text-xs">{position}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              onClick={handleCheckin}
              disabled={checking}
              className={`px-8 py-3 rounded-full font-bold text-white transition-all transform ${
                checking
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 active:scale-95 shadow-lg hover:shadow-xl'
              }`}
            >
              {checking ? 'Procesando...' : 'CHECK IN'}
            </button>
          </div>

          {/* Горизонтальна шкала прогресу */}
          <div className="mb-6 border-2 border-orange-400 rounded-2xl p-6 bg-orange-50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-700">
                LVL {levelScale[0]?.level || 1}
              </span>
              <span className="text-sm font-semibold text-gray-700">
                LVL {levelScale[levelScale.length - 1]?.level || currentLevel}
              </span>
            </div>

            {/* Скроллабельна шкала */}
            <div 
              ref={scrollRef}
              className="overflow-x-auto scrollbar-thin scrollbar-thumb-orange-400 scrollbar-track-orange-100 px-4"
              style={{ scrollbarWidth: 'thin' }}
            >
              <div className="flex gap-2 pb-2 items-center" style={{ minWidth: 'max-content', height: '80px' }}>
                {levelScale.map((item) => (
                  <div
                    key={item.level}
                    className="flex flex-col items-center justify-center gap-1 flex-shrink-0"
                  >
                    {/* Кружечок */}
                    <div
                      className={`rounded-full border-2 flex items-center justify-center transition-all overflow-hidden ${
                        item.badge 
                          ? 'w-14 h-14' 
                          : 'w-10 h-10'
                      } ${
                        item.isCurrent
                          ? 'border-orange-600 bg-gradient-to-br from-orange-400 to-red-500 scale-110 shadow-xl'
                          : item.isCompleted
                          ? 'border-orange-500 bg-gradient-to-br from-orange-300 to-red-400'
                          : 'border-gray-300 bg-white'
                      }`}
                    >
                      {item.badge ? (
                        <img 
                          src={item.badge.image_url} 
                          alt={item.badge.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.onerror = null;
                            const parent = target.parentElement;
                            if (parent && parent.contains(target)) {
                              target.style.display = 'none';
                              const fallback = document.createElement('span');
                              fallback.className = 'text-2xl';
                              fallback.textContent = '🏆';
                              parent.appendChild(fallback);
                            }
                          }}
                        />
                      ) : (
                        <span className={`text-xs font-bold ${item.isCompleted ? 'text-white' : 'text-gray-400'}`}>
                          {item.level}
                        </span>
                      )}
                    </div>
                    
                    {/* Лейбл */}
                    {item.badge && (
                      <span className="text-xs font-semibold text-orange-600 whitespace-nowrap">
                        LVL {item.level}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <p className="text-xs text-gray-600 text-center mt-3 italic">
              pudes recolectar los badges cada completa semana
            </p>
          </div>

          {/* Повідомлення */}
          {message && (
            <div className={`mb-6 p-4 rounded-xl font-medium text-center ${
              message.includes('✅') || message.includes('Вітаємо') 
                ? 'bg-green-100 text-green-800 border-2 border-green-300' 
                : message.includes('⚠️')
                ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-300'
                : 'bg-red-100 text-red-800 border-2 border-red-300'
            }`}>
              {message}
            </div>
          )}

          {/* Колекція бейджиків */}
          <div>
            <h2 className="text-2xl font-bold text-center mb-4 text-gray-700 italic">
              MIS BADGES
            </h2>
            
            <div 
              className="grid grid-cols-10 gap-2 p-6 bg-gray-100 rounded-2xl"
            >
              {displayedBadges.map((ub) => (
                <div
                  key={ub.badge.id}
                  onClick={() => selectBadge(ub.badge)}
                  className="aspect-square rounded-full bg-gradient-to-br from-orange-200 to-red-300 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform shadow-md border-2 border-orange-400 overflow-hidden"
                  title={`${ub.badge.name} - LVL ${ub.badge.level_required}`}
                >
                  <img 
                    src={ub.badge.image_url} 
                    alt={ub.badge.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      const parent = target.parentElement;
                      if (parent && parent.contains(target)) {
                        target.style.display = 'none';
                        const fallback = document.createElement('span');
                        fallback.className = 'text-2xl';
                        fallback.textContent = '🏆';
                        parent.appendChild(fallback);
                      }
                    }}
                  />
                </div>
              ))}
              
              {/* Порожні слоти для заповнення поточних рядів */}
              {Array.from({ 
                length: Math.max(0, (Math.ceil(displayedBadges.length / badgesPerRow) * badgesPerRow) - displayedBadges.length) 
              }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="aspect-square rounded-full bg-gray-300 flex items-center justify-center opacity-40"
                >
                  <span className="text-xl text-gray-400">?</span>
                </div>
              ))}
            </div>

            <p className="text-xs text-gray-600 text-center mt-3 italic">
              elige uno de los badges que has colectado
            </p>

            {/* Кнопка More */}
            {hasMoreBadges && (
              <div className="flex justify-center mt-4">
                <button
                  onClick={() => setVisibleBadges(prev => Math.min(prev + 20, userBadges.length))}
                  className="flex items-center gap-2 px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-full transition-colors shadow-md"
                >
                  <span>More</span>
                  <span className="text-sm">({remainingBadges} left)</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        .scrollbar-thin::-webkit-scrollbar {
          height: 8px;
          width: 8px;
        }
        .scrollbar-thumb-orange-400::-webkit-scrollbar-thumb {
          background-color: #fb923c;
          border-radius: 4px;
        }
        .scrollbar-track-orange-100::-webkit-scrollbar-track {
          background-color: #ffedd5;
          border-radius: 4px;
        }
        @keyframes scale-in {
          from {
            transform: scale(0.5);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}