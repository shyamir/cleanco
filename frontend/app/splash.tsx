import { useRouter } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

const videoSource = "../assets/videos/splash.mp4";

export default function Splash() {
  const router = useRouter();
  const [playerReady, setPlayerReady] = useState(false);

  const player = useVideoPlayer(require(videoSource), (player) => {
    player.play();
  });


  useEffect(() => {
    if (!player) return;

    // Poll until duration is known
    const interval = setInterval(() => {
      const duration = (player as any).duration;
      if (duration) {
        clearInterval(interval);
        setPlayerReady(true);

        // Navigate after actual video duration
        setTimeout(() => {
          router.replace("/onboarding");
        }, duration * 1000); // duration is in seconds
      }
    }, 100);

    return () => clearInterval(interval);
  }, [player]);

  return (
    <View style={styles.container}>
      <VideoView
        player={player}
        style={styles.video}
        contentFit="cover"
        fullscreenOptions={{ enable: false }}
        allowsPictureInPicture={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#002679",
  },
  video: {
    flex: 1,
    height: undefined,
  },
});

