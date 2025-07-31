import { CrispEventRequest } from '@/tools/crisp/models/crisp-event.request';
import { CrispMessageReceivedEventDataDto } from '@/tools/crisp/models/crisp-message-received-event-data.dto';

export const sampleCripsMessageReceivedEvent: CrispEventRequest<CrispMessageReceivedEventDataDto> =
  {
    website_id: '96fe7866-d005-4623-80b1-bd772e99855c',
    event: 'message:received',
    data: {
      website_id: '96fe7866-d005-4623-80b1-bd772e99855c',
      type: 'note',
      from: 'operator',
      origin: 'chat',
      content: 'Ticket 2J',
      fingerprint: 174401849743962,
      user: {
        nickname: 'Marc Rutkowski',
        user_id: '1d7f4c4a-ad9e-43c0-9cf5-d2ad65b0cc6f',
      },
      mentions: [],
      timestamp: 1744018497551,
      stamped: true,
      session_id: 'session_90b9002a-707b-45e4-89eb-2f93e321429c',
      inbox_id: null,
    },
    timestamp: 1744018497581,
  };
