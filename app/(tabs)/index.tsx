import { Text, View, Button, Image, StyleSheet, Alert } from "react-native";
import { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { Camera } from "expo-camera";
import * as MediaLibrary from "expo-media-library";
import { Paths, File } from "expo-file-system";

export default function Index() {
  const [image, setImage] = useState<string | null>(null);

  const openCamera = async () => {
    const permission = await Camera.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Permission Denied", "Camera permission is required!");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const openGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Permission Denied", "Gallery permission is required!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const saveImage = async () => {
    if (!image) {
      Alert.alert("No Image", "Please take or pick an image first!");
      return;
    }

    try {
      const { status } = await MediaLibrary.requestPermissionsAsync(true);
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Media library permission is required!");
        return;
      }

      const fileName = `saved_image_${Date.now()}.jpg`;

      const sourceFile = new File(image);
      const destinationFile = new File(Paths.document, fileName);
      sourceFile.copy(destinationFile);
      const destinationUri = destinationFile.uri;

      const asset = await MediaLibrary.createAssetAsync(destinationUri);
      await MediaLibrary.createAlbumAsync("MyApp Photos", asset, false);

      Alert.alert("Success!", `Image saved to gallery!\nFile: ${fileName}`);
    } catch (error) {
      console.error("Save error:", error);
      Alert.alert("Error", "Failed to save image. Please try again.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Maureen Alexandria - 00000107632</Text>

      <View style={styles.button}>
        <Button title="OPEN CAMERA" onPress={openCamera} />
      </View>

      <View style={styles.button}>
        <Button title="OPEN GALLERY" onPress={openGallery} />
      </View>

      {image && (
        <View style={styles.button}>
          <Button title="SAVE IMAGE" onPress={saveImage} color="green" />
        </View>
      )}

      {image && (
        <Image source={{ uri: image }} style={styles.image} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    marginBottom: 10,
    color: "white"
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
  },
  button: {
    marginVertical: 5,
    width: 150,
  },
  image: {
    width: 250,
    height: 200,
    marginTop: 20,
  },
});