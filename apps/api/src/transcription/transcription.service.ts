import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { TriggerTranscriptionDto } from './dto/trigger-transcription.dto';

@Injectable()
export class TranscriptionService {
  async trigger(dto: TriggerTranscriptionDto) {
    const asrBaseUrl = (
      process.env.ASR_SERVICE_URL ||
      (process.env.NODE_ENV === 'production' ? 'http://asr:8000' : 'http://localhost:8000')
    ).replace(/\/$/, '');
    const asrUrl = `${asrBaseUrl}/internal/transcribe`;

    let response: Response;

    try {
      response = await fetch(asrUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.ASR_SERVICE_API_KEY || '',
        },
        body: JSON.stringify({
          storage_key: dto.storageKey,
          language: dto.language || 'ky',
        }),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown ASR error';
      throw new ServiceUnavailableException(
        `ASR service is unavailable at ${asrUrl}. Start it with "docker compose up -d asr" or run the Python service on port 8000. Original error: ${message}`,
      );
    }

    if (!response.ok) {
      const text = await response.text();
      throw new ServiceUnavailableException(
        `ASR service responded with ${response.status} at ${asrUrl}. Details: ${text}`,
      );
    }

    return response.json();
  }
}
