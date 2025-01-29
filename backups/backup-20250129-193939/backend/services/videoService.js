const ffmpeg = require('fluent-ffmpeg');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');

class VideoService {
  constructor() {
    this.uploadDir = path.join(process.cwd(), 'uploads');
    this.ensureUploadDir();
  }

  async ensureUploadDir() {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Récupère les métadonnées d'une vidéo
   */
  async getVideoMetadata(videoPath) {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(videoPath, (err, metadata) => {
        if (err) reject(err);
        else resolve(metadata);
      });
    });
  }

  /**
   * Génère une miniature pour une vidéo
   */
  async generateThumbnail(videoPath, timestamp = '00:00:01') {
    const thumbnailPath = videoPath.replace(/\.[^/.]+$/, '_thumb.jpg');
    
    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .screenshots({
          timestamps: [timestamp],
          filename: path.basename(thumbnailPath),
          folder: path.dirname(thumbnailPath),
          size: '320x240'
        })
        .on('end', () => resolve(thumbnailPath))
        .on('error', reject);
    });
  }

  /**
   * Applique une transition entre deux vidéos
   */
  async applyTransition(video1Path, video2Path, transitionType, duration) {
    const outputPath = path.join(
      this.uploadDir,
      `transition_${Date.now()}.mp4`
    );

    return new Promise((resolve, reject) => {
      const command = ffmpeg();

      // Ajoute les vidéos sources
      command.input(video1Path);
      command.input(video2Path);

      // Configure la transition selon le type
      switch (transitionType) {
        case 'FADE':
          command.complexFilter([
            `[0:v]fade=t=out:st=${duration}:d=${duration}[v0]`,
            `[1:v]fade=t=in:st=0:d=${duration}[v1]`,
            '[v0][v1]concat=n=2:v=1[outv]'
          ]);
          break;
        
        case 'CROSSFADE':
          command.complexFilter([
            `[0:v][1:v]xfade=transition=fade:duration=${duration}[outv]`
          ]);
          break;
        
        default: // CUT
          command.complexFilter([
            '[0:v][1:v]concat=n=2:v=1[outv]'
          ]);
      }

      command
        .map('[outv]')
        .output(outputPath)
        .on('end', () => resolve(outputPath))
        .on('error', reject)
        .run();
    });
  }

  /**
   * Nettoie les fichiers temporaires
   */
  async cleanup(filePath) {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.error(`Erreur lors du nettoyage de ${filePath}:`, error);
    }
  }
}

module.exports = new VideoService();
