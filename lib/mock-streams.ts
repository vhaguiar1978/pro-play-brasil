export type ParticipantStream = {
  nickname: string;
  twitchUrl: string;
  isLive: boolean;
  gameLabel: string;
  viewersLabel: string;
  streamTitle: string;
};

const PARTICIPANT_STREAMS: ParticipantStream[] = [
];

export function getParticipantStream(nickname: string): ParticipantStream | undefined {
  return PARTICIPANT_STREAMS.find((stream) => stream.nickname.toLowerCase() === nickname.toLowerCase());
}

export function getAllParticipantStreams(): ParticipantStream[] {
  return PARTICIPANT_STREAMS.slice();
}

export function getLiveParticipantStreams(): ParticipantStream[] {
  return PARTICIPANT_STREAMS.filter((stream) => stream.isLive);
}
