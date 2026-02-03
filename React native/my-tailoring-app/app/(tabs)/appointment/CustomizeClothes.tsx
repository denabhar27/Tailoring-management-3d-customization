import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  Dimensions,
  Alert,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { cartService } from "../../../utils/apiService";

const { width, height } = Dimensions.get("window");

export default function CustomizeClothes() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [image, setImage] = useState<string | null>(null);
  const insets = useSafeAreaInsets();
  const [garmentCategory, setGarmentCategory] = useState("");
  const [style, setStyle] = useState("");
  const [fabricType, setFabricType] = useState("");
  const [buttonStyle, setButtonStyle] = useState("");
  const [sizeMeasurement, setSizeMeasurement] = useState("");
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const getPriceForGarment = (garment: string): number => {
    const prices: { [key: string]: number } = {
      Shirt: 800,
      Pants: 900,
      Suit: 2500,
      Dress: 1800,
      Jacket: 1200,
      Coat: 1500,
      Skirt: 700,
      Blouse: 600,
    };
    return prices[garment] || 1000;
  };

  const handleAddToCart = async () => {
    if (!garmentCategory) {
      Alert.alert("Missing Information", "Please select a garment category");
      return;
    }

    setLoading(true);
    
    try {
      
      const customizeData = {
        serviceType: 'customize',
        serviceId: 2, 
        serviceName: `Custom ${garmentCategory}`,
        basePrice: getPriceForGarment(garmentCategory).toString(),
        finalPrice: getPriceForGarment(garmentCategory).toString(),
        specificData: {
          garmentType: garmentCategory,
          style: style,
          fabricType: fabricType,
          buttonStyle: buttonStyle,
          sizeMeasurement: sizeMeasurement,
          imageUrl: image || 'no-image'
        }
      };

      const result = await cartService.addToCart(customizeData);
      
      if (result.success) {
        Alert.alert("Success!", "Customize service added to cart!", [
          {
            text: "View Cart",
            onPress: () => router.push("/(tabs)/cart/Cart"),
          },
          {
            text: "Continue Shopping",
            onPress: () => router.push("/home"),
          },
        ]);
      } else {
        throw new Error(result.message || "Failed to add customize service to cart");
      }
    } catch (error: any) {
      console.error("Add service error:", error);
      Alert.alert(
        "Error", 
        error.message || "Failed to add customize service. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: height * 0.12 }}
      >
       
        <View style={styles.header}>
          <Image
            source={require("../../../assets/images/logo.png")}
            style={styles.logo}
          />
          <Text style={styles.headerTitle}>Jackman Tailor Deluxe</Text>
          <TouchableOpacity style={styles.profileIcon}>
            <Ionicons name="person-circle-outline" size={28} color="#000" />
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>
              Customize your clothes in your preferred design!
            </Text>
          </View>

          {step === 1 && (
            <View style={styles.section}>
              <Text style={styles.label}>Garment Category</Text>
              <TextInput
                placeholder="Select garment (e.g. pants, suit)"
                style={styles.input}
                value={garmentCategory}
                onChangeText={setGarmentCategory}
              />

              <Text style={styles.label}>Style</Text>
              <TextInput
                placeholder="Select style (casual, formal, business)"
                style={styles.input}
                value={style}
                onChangeText={setStyle}
              />

              <Text style={styles.label}>Reference Image</Text>
              <TouchableOpacity
                style={styles.imageUploadBox}
                onPress={pickImage}
              >
                {image ? (
                  <Image source={{ uri: image }} style={styles.previewImage} />
                ) : (
                  <Text style={{ color: "#777" }}>Upload image or design</Text>
                )}
              </TouchableOpacity>

              <View style={styles.buttonRow}>
                <TouchableOpacity
                             style={[styles.button, styles.cancelBtn]}
                             onPress={() => router.push("../appointment/appointmentSelection")}
                           >
                             <Text style={styles.cancelText}>Cancel</Text>
                           </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.nextBtn]}
                  onPress={() => setStep(2)}
                >
                  <Text style={styles.nextText}>Next</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {step === 2 && (
            <View style={styles.section}>
              <Text style={styles.label}>Design Pattern</Text>
              <View style={styles.patternRow}>
                {[...Array(6)].map((_, i) => (
                  <View key={i} style={styles.patternBox} />
                ))}
              </View>

              <Text style={styles.label}>Color</Text>
              <View style={styles.colorRow}>
                {["#F8C8DC", "#FDFD96", "#B5EAD7", "#CBAACB", "#C3B1E1"].map(
                  (color, i) => (
                    <View
                      key={i}
                      style={[styles.colorBox, { backgroundColor: color }]}
                    />
                  )
                )}
              </View>

              <Text style={styles.label}>Fabric Type</Text>
              <TextInput
                placeholder="Select fabric (cotton, silk, etc.)"
                style={styles.input}
                value={fabricType}
                onChangeText={setFabricType}
              />

              <Text style={styles.label}>Button Style</Text>
              <TextInput
                placeholder="Select button style"
                style={styles.input}
                value={buttonStyle}
                onChangeText={setButtonStyle}
              />

              <Text style={styles.label}>Size Measurement</Text>
              <TextInput placeholder="Enter your size details" style={styles.input} value={sizeMeasurement} onChangeText={setSizeMeasurement} />

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelBtn]}
                  onPress={() => setStep(1)}
                >
                  <Text style={styles.cancelText}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.nextBtn]}
                  onPress={handleAddToCart}
                  disabled={loading}
                >
                  <Text style={styles.nextText}>
                    {loading ? "Adding..." : "Add to Cart"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TouchableOpacity onPress={() => router.push("../home")}>
          <View style={styles.navItemWrap}>
            <Ionicons name="home-outline" size={20} color="#9CA3AF" />
          </View>
        </TouchableOpacity>
        <View style={styles.navItemWrapActive}>
          <Ionicons name="receipt-outline" size={20} color="#7A5A00" />
        </View>
        <TouchableOpacity onPress={() => router.push("/(tabs)/cart/Cart")}>
          <View style={styles.navItemWrap}>
            <Ionicons name="cart-outline" size={20} color="#9CA3AF" />
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push("../UserProfile/profile")}>
          <View style={styles.navItemWrap}>
            <Ionicons name="person-outline" size={20} color="#9CA3AF" />
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    marginTop: height * 0.05,
    paddingHorizontal: width * 0.04,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logo: { width: width * 0.08, height: width * 0.08, borderRadius: 50 },
  headerTitle: {
    fontWeight: "600",
    fontSize: width * 0.035,
    color: "#222",
    flex: 1,
    marginLeft: 8,
  },
  profileIcon: { marginLeft: 8 },

  card: {
    backgroundColor: "#fff",
    width: "85%",
    alignSelf: "center",
    marginTop: height * 0.05,
    marginBottom: height * 0.1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#ddd",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  cardHeader: {
    backgroundColor: "#b69e64",
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    paddingVertical: height * 0.02,
    paddingHorizontal: width * 0.05,
  },
  cardTitle: {
    fontSize: width * 0.04,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
  },

  section: {
    paddingHorizontal: width * 0.05,
    paddingVertical: height * 0.02,
  },
  label: {
    fontWeight: "600",
    marginBottom: 6,
    color: "#333",
    fontSize: width * 0.032,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 15,
  },
  imageUploadBox: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 12,
    height: 120,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  previewImage: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
    resizeMode: "cover",
  },
  patternRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 12,
  },
  patternBox: {
    width: 40,
    height: 40,
    backgroundColor: "#ddd",
    borderRadius: 8,
  },
  colorRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 15,
  },
  colorBox: {
    width: 35,
    height: 35,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginTop: 10,
  },
  button: {
    width: width * 0.3,
    borderRadius: 20,
    alignItems: "center",
    paddingVertical: height * 0.012,
  },
  cancelBtn: { backgroundColor: "#f8d7da" },
  nextBtn: { backgroundColor: "#9dc5e3" },
  cancelText: { color: "#b94a48", fontWeight: "600" },
  nextText: { color: "#fff", fontWeight: "600" },

  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#EEE",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -3 },
  },
  navItemWrap: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  navItemWrapActive: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#FDE68A",
    alignItems: "center",
    justifyContent: "center",
  },
});
