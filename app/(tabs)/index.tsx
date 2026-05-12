import {
  Text,
  View,
  Button,
  Image,
  StyleSheet,
  Alert,
} from "react-native";

import { useState } from "react";

import * as ImagePicker from "expo-image-picker";
import { Camera } from "expo-camera";
import * as MediaLibrary from "expo-media-library";
import { Paths, File } from "expo-file-system";
import * as Location from "expo-location";

import { supabase } from "../../lib/supabase";

export default function Index() {
  const [image, setImage] = useState<string | null>(null);

  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const openCamera = async () => {
    const permission = await Camera.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Permission Denied", "Camera permission is required!");
      return;
    }

    const locationPermission =
      await Location.requestForegroundPermissionsAsync();

    if (locationPermission.status !== "granted") {
      Alert.alert("Permission Denied", "Location permission is required!");
      return;
    }

    const currentLocation = await Location.getCurrentPositionAsync({});

    setLocation({
      latitude: currentLocation.coords.latitude,
      longitude: currentLocation.coords.longitude,
    });

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

  if (!location) {
    Alert.alert("No Location", "Location not found!");
    return;
  }

  try {
    // save ke gallery
    const { status } = await MediaLibrary.requestPermissionsAsync(true);

    if (status !== "granted") {
      Alert.alert(
        "Permission Denied",
        "Media library permission is required!"
      );
      return;
    }

    const fileName = `saved_image_${Date.now()}.jpg`;

    const sourceFile = new File(image);
    const destinationFile = new File(Paths.document, fileName);

    sourceFile.copy(destinationFile);

    const destinationUri = destinationFile.uri;

    const asset = await MediaLibrary.createAssetAsync(destinationUri);

    await MediaLibrary.createAlbumAsync(
      "MyApp Photos",
      asset,
      false
    );

    // upload ke supabase
    const response = await fetch(image);

const arrayBuffer = await response.arrayBuffer();

const { error: uploadError } = await supabase.storage
  .from("photos")
  .upload(fileName, arrayBuffer, {
    contentType: "image/jpeg",
  });
    if (uploadError) {
      console.log(uploadError);

      Alert.alert("Upload Failed", uploadError.message);

      return;
    }

    // ambil public url
    const { data } = supabase.storage
      .from("photos")
      .getPublicUrl(fileName);

    const imageUrl = data.publicUrl;

    // insert database
    const { error: insertError } = await supabase
      .from("photos")
      .insert([
        {
          image_url: imageUrl,
          latitude: location.latitude,
          longitude: location.longitude,
        },
      ]);

    if (insertError) {
      console.log(insertError);

      Alert.alert("Database Error", insertError.message);

      return;
    }

    Alert.alert(
      "Success!",
      "Image saved & uploaded to Supabase!"
    );
  } catch (error) {
    console.log(error);

    Alert.alert(
      "Error",
      "Failed to save image."
    );
  }
};

  const uploadToSupabase = async () => {
    if (!image) {
      Alert.alert("No Image", "Please take or pick image first!");
      return;
    }

    if (!location) {
      Alert.alert("No Location", "Location not found!");
      return;
    }

    try {
      const fileName = `photo_${Date.now()}.jpg`;

      const response = await fetch(image);
      const blob = await response.blob();

      // upload image ke storage
      const { error: uploadError } = await supabase.storage
        .from("photos")
        .upload(fileName, blob, {
          contentType: "image/jpeg",
        });

      if (uploadError) {
        console.log(uploadError);

        Alert.alert("Upload Failed", uploadError.message);

        return;
      }

      // ambil public url image
      const { data } = supabase.storage
        .from("photos")
        .getPublicUrl(fileName);

      const imageUrl = data.publicUrl;

      // insert ke database
      const { error: insertError } = await supabase
        .from("photos")
        .insert([
          {
            image_url: imageUrl,
            latitude: location.latitude,
            longitude: location.longitude,
          },
        ]);

      if (insertError) {
        console.log(insertError);

        Alert.alert("Database Error", insertError.message);

        return;
      }

      Alert.alert(
        "Success",
        "Image & location uploaded to Supabase!"
      );
    } catch (error) {
      console.log(error);

      Alert.alert("Error", "Failed upload to Supabase");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        Maureen Alexandria - 00000107632
      </Text>

      <View style={styles.button}>
        <Button
          title="OPEN CAMERA"
          onPress={openCamera}
        />
      </View>

      <View style={styles.button}>
        <Button
          title="OPEN GALLERY"
          onPress={openGallery}
        />
      </View>

      {image && (
        <View style={styles.button}>
          <Button
            title="SAVE IMAGE"
            onPress={saveImage}
            color="green"
          />
        </View>
      )}

      {location && (
        <View style={{ marginTop: 10 }}>
          <Text style={{ color: "white" }}>
            Latitude: {location.latitude}
          </Text>

          <Text style={{ color: "white" }}>
            Longitude: {location.longitude}
          </Text>
        </View>
      )}

      {image && (
        <Image
          source={{ uri: image }}
          style={styles.image}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#222",
  },

  text: {
    marginBottom: 10,
    color: "white",
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
  },

  button: {
    marginVertical: 5,
    width: 180,
  },

  image: {
    width: 250,
    height: 200,
    marginTop: 20,
    borderRadius: 10,
  },
});