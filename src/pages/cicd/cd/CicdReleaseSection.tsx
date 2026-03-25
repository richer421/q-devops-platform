import { releaseStages, releases } from '@/mock';
import { ReleaseCard } from '@/components/cicd/cd';

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
