import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useTheme } from "@/theme/useTheme";
import { Icon } from "@/constants/icon";

type UploadImageProps = {
  onUploadSuccess?: (uri: string | null) => void; // ✅ new prop
};

const UploadImage: React.FC<UploadImageProps> = ({ onUploadSuccess }) => {
  const theme = useTheme();
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled) {
        const uri = result.assets[0].uri;
        setUploading(true);

        // Simulate upload delay (replace with your upload API)
        setTimeout(() => {
          setUploading(false);
          setUploaded(true);
          setImageUri(uri);

          // ✅ notify parent
          onUploadSuccess?.(uri);
        }, 2000);
      }
    } catch (err) {
      console.log("Image picker error:", err);
    }
  };

  const handleDelete = () => {
    setUploaded(false);
    setImageUri(null);
    // ✅ notify parent that image is cleared
    onUploadSuccess?.(null);
  };

  return (
    <View
      style={[
        styles.container,
        {
          borderStyle: "dashed",
          borderColor: theme.colors.system.border.default,
        },
      ]}
    >
      {!uploaded && !uploading && (
        <TouchableOpacity onPress={handlePickImage} style={styles.uploadArea}>
          <Icon.upload color={theme.colors.toggle.label.active} />
          <Text
            style={[styles.text, { color: theme.colors.toggle.label.active }]}
          >
            Upload transfer slip
          </Text>
        </TouchableOpacity>
      )}

      <View style={styles.uploaderWrapper}>
        {uploading && (
          <View style={styles.uploadingArea}>
            <ActivityIndicator
              size="small"
              color={theme.colors.toggle.label.active}
            />
            <Text
              style={[styles.text, { color: theme.colors.toggle.label.active }]}
            >
              Uploading slip...
            </Text>
          </View>
        )}

        {uploaded && imageUri && (
          <View style={styles.uploadedArea}>
            <View style={styles.uploadedArea}>
              <Icon.checkFill color={theme.colors.system.body.success} />
              <Text
                style={[
                  styles.text,
                  { color: theme.colors.toggle.label.active },
                ]}
              >
                transferslip.jpg
              </Text>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity onPress={handlePickImage}>
                <Icon.upload color={theme.colors.toggle.label.active} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete}>
                <Icon.trash color={theme.colors.system.body.error} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  uploaderWrapper: {
    flexDirection: "column",
    gap: 12,
    justifyContent: "space-between",
  },
  uploadArea: {
    alignItems: "center",
    justifyContent: "center",
  },
  uploadingArea: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  uploadedArea: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  text: {
    fontSize: 14,
    marginTop: 4,
  },
});

export default UploadImage;
