import React, { useEffect, useState } from 'react';
import { Flame, Trophy, Award, Sparkles } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface StudentStreakBadgeProps {
  currentUser?: any;
}

export const StudentStreakBadge: React.FC<StudentStreakBadgeProps> = ({ currentUser }) => {
  const [streakDays, setStreakDays] = useState<number | null>(null);
  const [xpPoints, setXpPoints] = useState<number | null>(null);

  useEffect(() => {
    if (!currentUser) {
      setStreakDays(null);
      setXpPoints(null);
      return;
    }

    const loadStreakAndXp = async () => {
      try {
        const today = new Date().toDateString();
        const storageKey = `osera_streak_${currentUser.id || currentUser.email}`;
        const lastVisit = localStorage.getItem(`${storageKey}_last_date`) || localStorage.getItem(`simplest_streak_${currentUser.id || currentUser.email}_last_date`);
        let currentStreak = Number(localStorage.getItem(`${storageKey}_days`) || localStorage.getItem(`simplest_streak_${currentUser.id || currentUser.email}_days`)) || 1;
        let currentXp = Number(localStorage.getItem(`osera_xp_${currentUser.id || currentUser.email}`) || localStorage.getItem(`simplest_xp_${currentUser.id || currentUser.email}`)) || 150;

        // Try syncing from Supabase profile if available
        try {
          if (currentUser.id) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('study_streak, xp_points')
              .eq('id', currentUser.id)
              .single();

            if (profile) {
              if (profile.study_streak) currentStreak = profile.study_streak;
              if (profile.xp_points) currentXp = profile.xp_points;
            }
          }
        } catch (e) {}

        if (lastVisit) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          
          if (lastVisit === yesterday.toDateString()) {
            currentStreak += 1;
          } else if (lastVisit !== today) {
            currentStreak = 1;
          }
        }

        localStorage.setItem(`${storageKey}_days`, String(currentStreak));
        localStorage.setItem(`${storageKey}_last_date`, today);
        localStorage.setItem(`osera_xp_${currentUser.id || currentUser.email}`, String(currentXp));

        setStreakDays(currentStreak);
        setXpPoints(currentXp);
      } catch (e) {
        console.warn('Streak tracking error:', e);
      }
    };

    loadStreakAndXp();
  }, [currentUser]);

  // If not logged in, do not render streak/XP badges
  if (!currentUser || streakDays === null) return null;

  return (
    <div className="flex items-center gap-2 animate-fade-in">
      {/* Daily Streak Flame */}
      <div 
        className="flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-amber-500/15 to-orange-500/15 border border-amber-300/80 rounded-xl text-[11px] font-black text-amber-800 shadow-2xs select-none"
        title="أيام المذاكرة المتتالية بدون انقطاع"
      >
        <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500 animate-pulse" />
        <span>{streakDays} {streakDays === 1 ? 'يوم متتالي' : 'أيام متتالية'}</span>
      </div>

      {/* Student XP Badge */}
      <div 
        className="hidden sm:flex items-center gap-1 px-2.5 py-1 bg-teal-50 border border-teal-200 rounded-xl text-[11px] font-black text-teal-900 select-none shadow-2xs"
        title="نقاط خبرة المذاكرة والتفاعل في Osera AI"
      >
        <Trophy className="w-3.5 h-3.5 text-teal-600" />
        <span>{xpPoints} XP</span>
      </div>
    </div>
  );
};

export default StudentStreakBadge;
