import { ReleaseCard } from '../../../components/cicd/ReleaseCard';
import { releaseStages, releases } from '@/mock';

export function CicdReleaseSection() {
  return (
    <>
      {releases.map((release) => (
        <ReleaseCard
          key={release.id}
          release={release}
          stages={releaseStages[release.id] ?? []}
        />
      ))}
    </>
  );
}
