import { CrewProfile } from './CrewProfile';
import { useCrewData } from '../hooks/useCrewData';

interface CrewProfileWrapperProps {
  employeeId: string;
}

export function CrewProfileWrapper({ employeeId }: CrewProfileWrapperProps) {
  const { profile, stats } = useCrewData(employeeId);

  return <CrewProfile profile={profile} stats={stats} />;
}
