declare module '@ffmpeg-installer/ffmpeg' {
    interface FFmpeg {
        path: string;
        version: string;
    }
    const ffmpeg: FFmpeg;
    export default ffmpeg;
} 