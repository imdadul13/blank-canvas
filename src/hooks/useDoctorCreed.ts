import { useState, useEffect, useCallback, useMemo } from 'react';
import { DoctorCreed, CircadianPhase, resolveIntelligentCreed, DOCTOR_CREEDS } from '../utils/doctorCreeds';

export interface UseDoctorCreedReturn {
  creed: DoctorCreed;
  shuffleCreed: () => void;
  isShuffling: boolean;
  totalCount: number;
}

export function useDoctorCreed(phase: CircadianPhase = 'morning'): UseDoctorCreedReturn {
  const [manualOffset, setManualOffset] = useState<number>(0);
  const [isShuffling, setIsShuffling] = useState<boolean>(false);
  const [now, setNow] = useState<Date>(() => new Date());

  // Periodically refresh the time slot (checks every 60s for 5-minute & hourly transitions)
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const creed = useMemo(() => {
    return resolveIntelligentCreed(phase, now, manualOffset);
  }, [phase, now, manualOffset]);

  const shuffleCreed = useCallback(() => {
    setIsShuffling(true);
    setManualOffset((prev) => prev + 1);
    setTimeout(() => {
      setIsShuffling(false);
    }, 350);
  }, []);

  return {
    creed,
    shuffleCreed,
    isShuffling,
    totalCount: DOCTOR_CREEDS.length,
  };
}
