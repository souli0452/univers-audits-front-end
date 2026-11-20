import { typeAudioEnregistre } from './audio-enregistre';

describe('typeAudioEnregistre', () => {
    it('Chrome et Android : audio/webm, extension .webm', () => {
        expect(typeAudioEnregistre('audio/webm;codecs=opus')).toEqual({ type: 'audio/webm', extension: 'webm' });
        expect(typeAudioEnregistre('audio/webm')).toEqual({ type: 'audio/webm', extension: 'webm' });
    });

    it('iPhone (Safari) : audio/mp4, extension .m4a — plus étiqueté à tort « webm »', () => {
        expect(typeAudioEnregistre('audio/mp4')).toEqual({ type: 'audio/mp4', extension: 'm4a' });
        expect(typeAudioEnregistre('audio/mp4;codecs=mp4a.40.2')).toEqual({ type: 'audio/mp4', extension: 'm4a' });
    });

    it('Firefox : audio/ogg, extension .ogg', () => {
        expect(typeAudioEnregistre('audio/ogg;codecs=opus')).toEqual({ type: 'audio/ogg', extension: 'ogg' });
    });

    it('AAC seul : audio/aac, extension .aac', () => {
        expect(typeAudioEnregistre('audio/aac')).toEqual({ type: 'audio/aac', extension: 'aac' });
    });

    it('un navigateur qui annonce « video/webm » pour un enregistrement audio : on le garde en audio', () => {
        expect(typeAudioEnregistre('video/webm;codecs=opus')).toEqual({ type: 'audio/webm', extension: 'webm' });
    });

    it('type absent ou inconnu : audio/webm par défaut (ce que produisent Chrome et Android)', () => {
        expect(typeAudioEnregistre('')).toEqual({ type: 'audio/webm', extension: 'webm' });
        expect(typeAudioEnregistre(undefined)).toEqual({ type: 'audio/webm', extension: 'webm' });
        expect(typeAudioEnregistre('application/x-truc')).toEqual({ type: 'audio/webm', extension: 'webm' });
    });

    it('ignore la casse', () => {
        expect(typeAudioEnregistre('AUDIO/MP4')).toEqual({ type: 'audio/mp4', extension: 'm4a' });
    });
});
