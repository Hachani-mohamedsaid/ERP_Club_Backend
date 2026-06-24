import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface ImgbbResponse {
  success: boolean;
  data?: { url: string; display_url: string };
  error?: { message?: string };
}

@Injectable()
export class ImgbbService {
  private readonly logger = new Logger(ImgbbService.name);

  constructor(private readonly config: ConfigService) {}

  async uploadImage(file: Express.Multer.File): Promise<string> {
    const apiKey = this.config.get<string>('IMGBB_API_KEY');
    if (!apiKey) {
      throw new BadRequestException('IMGBB_API_KEY non configurée sur le serveur.');
    }

    const body = new URLSearchParams();
    body.append('key', apiKey);
    body.append('image', file.buffer.toString('base64'));

    const response = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body,
    });

    const json = (await response.json()) as ImgbbResponse;

    if (!response.ok || !json.success || !json.data?.url) {
      this.logger.error(`ImgBB upload failed: ${json.error?.message ?? response.statusText}`);
      throw new BadRequestException("Échec de l'upload du logo club.");
    }

    return json.data.url;
  }
}
