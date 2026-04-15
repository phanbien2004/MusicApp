import { createStompClient } from '@/api/apiSocket';
import { setJamContext } from '@/services/jamService';
import { TrackContentType } from '@/services/searchService';
import { AudioPlayer, useAudioPlayer } from 'expo-audio';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useJam } from './jam-context';

export interface CurrentTrack extends TrackContentType {
    id: number;
    trackUrl: string | any;
}

interface CurrentTrackContextType {
    currentTrack: CurrentTrack | null;
    setCurrentTrack: (track: CurrentTrack, isReceiptFromJam: boolean) => void;
    player: AudioPlayer;
}

const CurrentTrackContext = createContext<CurrentTrackContextType | undefined>(undefined);

export const CurrentTrackProvider = ({ children }: { children: React.ReactNode }) => {
    const [currentTrack, setCurrentTrack] = useState<CurrentTrack | null>(null);
    const player = useAudioPlayer(currentTrack?.trackUrl || null);
    const {activeSession} = useJam();
    const client = createStompClient();

    useEffect(() => {
        if (currentTrack?.trackUrl) {
            console.log("CurrentTrackProvider - New track URL:", currentTrack.trackUrl);
            console.log("CurrentTrackProvider - id:", currentTrack.id);
            const playTimeout = setTimeout(() => {
                player.play();
            }, 150); 
            return () => clearTimeout(playTimeout);
        }
    }, [currentTrack?.trackUrl]);

        const handleSetTrack = async (track: CurrentTrack, isReceiptFromJam: boolean) => {
        if (isReceiptFromJam) {
            setCurrentTrack(track);
        } else {
            if (activeSession) {
                const sendTrackUpdate = () => {
                    if(activeSession.isHost) {
                        client.publish({
                        destination: '/app/jam/track',
                        body: JSON.stringify({
                            jamId: activeSession.sessionId,
                            trackId: track.id,
                        })
                    })}
                    client.publish({
                        destination: '/app/jam/notification',
                        body: JSON.stringify({
                            jamId: activeSession.sessionId,
                            trackId: track.id,
                            notificationType: "JAM_INTERACTION",
                            interactionType: "PICK",
                        })
                    })
                };
                if (client.connected) {
                    sendTrackUpdate();
                } else {
                    client.onConnect = () => {
                        sendTrackUpdate();
                    };
                    client.activate();
                }
                if (!activeSession.isHost) {
                    Alert.alert("Request sent. Awaiting host approval.");
                }
                if(activeSession.sessionId && activeSession.isHost) {
                    try{
                        const res = await setJamContext(activeSession.sessionId,track.id,null,null);
                    }catch(e){
                        console.error("Loi SETJAMCONTEXT: ", e);
                    }
                }
            } else {
                setCurrentTrack(track);
            }
        }
    };

    return (
        <CurrentTrackContext.Provider value={{ 
            currentTrack, 
            setCurrentTrack: handleSetTrack, 
            player 
        }}>
            {children}
        </CurrentTrackContext.Provider>
    );
};

export const useCurrentTrack = () => useContext(CurrentTrackContext);