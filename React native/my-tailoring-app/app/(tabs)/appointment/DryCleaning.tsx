
import React, { useState, useCallback, useEffect } from "react";
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
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Picker } from "@react-native-picker/picker";
import DateTimePickerModal from "../../../components/DateTimePickerModal";
import apiCall, { cartService, appointmentSlotService } from "../../../utils/apiService";
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get("window");

interface TimeSlot {
  slot_id: number;
  time_slot: string;
  display_time: string;
  capacity: number;
  booked: number;
  available: number;
  status: 'available' | 'limited' | 'full' | 'inactive';
  statusLabel: string;
  isClickable: boolean;
}

export default function DryCleaningClothes() {
  const router = useRouter();
  const [image, setImage] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState("");
  const [quantity, setQuantity] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [clothingBrand, setClothingBrand] = useState("");
  const [pickupDate, setPickupDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("");
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(true);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleDateConfirm = async (selectedDate: Date) => {
    
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    try {
      const checkResult = await apiCall(`/shop-schedule/check?date=${dateStr}`);
      
      if (!checkResult.success || !checkResult.is_open) {
        Alert.alert(
          'Shop Closed',
          'The shop is closed on this date. Please select another date.',
          [{ text: 'OK' }]
        );
        setShowDatePicker(false);
        return; 
      }
    } catch (error: any) {
      console.error('Error checking date availability:', error);
      
      const dayOfWeek = selectedDate.getDay();
      if (dayOfWeek === 0) {
        Alert.alert(
          'Shop Closed',
          'The shop is closed on Sundays. Please select another date.',
          [{ text: 'OK' }]
        );
        setShowDatePicker(false);
        return;
      }
    }
    
    setPickupDate(selectedDate);
    setShowDatePicker(false);
    setSelectedTimeSlot(""); 
    await loadTimeSlots(selectedDate);
  };

  const loadTimeSlots = async (date: Date) => {
    setLoadingSlots(true);
    try {
      
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      const result = await appointmentSlotService.getAllSlotsWithAvailability('dry_cleaning', dateStr);
      
      if (result.success) {
        if (!result.isShopOpen) {
          setIsShopOpen(false);
          setTimeSlots([]);
          Alert.alert('Shop Closed', 'The shop is closed on this date. Please select another date.');
          return;
        }
        
        setIsShopOpen(true);
        setTimeSlots(result.slots || []);
      } else {
        setTimeSlots([]);
        Alert.alert('Error', result.message || 'Failed to load time slots');
      }
    } catch (error: any) {
      console.error('Error loading time slots:', error);
      setTimeSlots([]);
      Alert.alert('Error', 'Failed to load time slots. Please try again.');
    } finally {
      setLoadingSlots(false);
    }
  };

  const handlePickerCancel = () => {
    setShowDatePicker(false);
  };

  useFocusEffect(
    useCallback(() => {
      
      if (pickupDate) {
        loadTimeSlots(pickupDate);
      }
    }, [pickupDate])
  );

  useEffect(() => {
    if (!pickupDate) return;

    loadTimeSlots(pickupDate);

    const refreshInterval = setInterval(() => {
      
      const year = pickupDate.getFullYear();
      const month = String(pickupDate.getMonth() + 1).padStart(2, '0');
      const day = String(pickupDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      appointmentSlotService.getAllSlotsWithAvailability('dry_cleaning', dateStr, 5000)
        .then((result) => {
          if (result.success && result.slots) {
            
            setTimeSlots((currentSlots) => {
              
              const currentCounts = JSON.stringify(currentSlots.map(s => ({ time: s.time_slot, available: s.available })));
              const newCounts = JSON.stringify(result.slots.map(s => ({ time: s.time_slot, available: s.available })));
              
              if (currentCounts !== newCounts) {
                
                if (!result.isShopOpen) {
                  setIsShopOpen(false);
                  return [];
                } else {
                  setIsShopOpen(true);
                  return result.slots || [];
                }
              }
              
              return currentSlots;
            });
          }
        })
        .catch((error: any) => {

          if (!error.message?.includes('timeout')) {
            console.warn('[POLLING] Error polling time slots:', error.message);
          }
        });
    }, 5000); 

    return () => clearInterval(refreshInterval);
  }, [pickupDate]); 

  const garmentTypes = [
    "Shirt",
    "Pants",
    "Suit",
    "Dress",
    "Jacket",
    "Coat",
    "Skirt",
    "Blouse",
    "Wedding Gown",
    "Barong",
  ];

  const getPriceForGarment = (garment: string): number => {
    const prices: { [key: string]: number } = {
      Shirt: 150,
      Pants: 180,
      Suit: 400,
      Dress: 350,
      Jacket: 250,
      Coat: 300,
      Skirt: 200,
      Blouse: 150,
      "Wedding Gown": 1200,
      Barong: 250,
    };
    return prices[garment] || 200;
  };

  const handleAddService = async () => {
    if (!selectedItem || !quantity) {
      Alert.alert("Missing Information", "Please fill in all required fields");
      return;
    }

    if (!selectedTimeSlot) {
      Alert.alert("Missing Information", "Please select a time slot");
      return;
    }

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) {
      Alert.alert("Invalid Quantity", "Please enter a valid quantity");
      return;
    }

    const unitPrice = getPriceForGarment(selectedItem);
    const totalPrice = unitPrice * qty;

    let description = `${qty} ${selectedItem}(s) - Professional dry cleaning`;
    if (clothingBrand) {
      description += ` (${clothingBrand})`;
    }
    if (specialInstructions) {
      description += ` - ${specialInstructions}`;
    }

    try {
      
      let slotResult = null;
      try {
        
        const year = pickupDate.getFullYear();
        const month = String(pickupDate.getMonth() + 1).padStart(2, '0');
        const day = String(pickupDate.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        slotResult = await appointmentSlotService.bookSlot('dry_cleaning', dateStr, selectedTimeSlot);
        if (!slotResult || !slotResult.success) {
          const errorMsg = slotResult?.message || 'Failed to book appointment slot. This time may already be taken.';
          console.error('Slot booking failed:', slotResult);
          Alert.alert('Slot Unavailable', errorMsg);
          return;
        }
        console.log('Slot booked successfully:', slotResult);
      } catch (slotError: any) {
        console.error('Slot booking error:', slotError);
        const errorMsg = slotError.message || 'Failed to book appointment slot. Please try again.';
        Alert.alert('Booking Error', errorMsg);
        return;
      }

      let imageUrl = '';
      if (image) {
        try {
          const formData = new FormData();
          formData.append('dryCleaningImage', {
            uri: image,
            type: 'image/jpeg',
            name: 'dryclean-image.jpg',
          } as any);

          const token = await AsyncStorage.getItem('userToken');
          const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL?.replace('/api', '') || 'http://192.168.254.106:5000';
          const uploadResponse = await fetch(`${API_BASE}/api/dry-cleaning/upload-image`, {
            method: 'POST',
            headers: {
              'Authorization': token ? `Bearer ${token}` : '',
            },
            body: formData,
          });

          const uploadResult = await uploadResponse.json();
          
          if (uploadResult.success) {
            imageUrl = uploadResult.data.url || uploadResult.data.filename || '';
            console.log('Image uploaded successfully, URL:', imageUrl);
          } else {
            console.warn('Image upload failed, continuing without image:', uploadResult.message);
          }
        } catch (uploadError) {
          console.error('Image upload failed:', uploadError);
          Alert.alert('Warning', 'Image upload failed. Continuing without image.');
        }
      }

      const year = pickupDate.getFullYear();
      const month = String(pickupDate.getMonth() + 1).padStart(2, '0');
      const day = String(pickupDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      const pickupDateTime = `${dateStr}T${selectedTimeSlot}`;

      const pricePerItem = getPriceForGarment(selectedItem);
      const isEstimatedPrice = false; 
      
      const dryCleaningData = {
        serviceType: 'dry_cleaning',
        serviceId: null, 
        quantity: qty,
        basePrice: '0',
        finalPrice: totalPrice.toString(),
        pricingFactors: {
          quantity: qty,
          pricePerItem: pricePerItem.toString(),
          pickupDate: pickupDateTime
        },
        specificData: {
          serviceName: `${selectedItem} Dry Cleaning`,
          brand: clothingBrand || '',
          notes: specialInstructions || '',
          garmentType: selectedItem,
          quantity: qty,
          imageUrl: imageUrl || 'no-image',
          pickupDate: pickupDateTime, 
          appointmentTime: selectedTimeSlot, 
          pricePerItem: pricePerItem.toString(),
          isEstimatedPrice: isEstimatedPrice,
          uploadedAt: new Date().toISOString()
        }
      };

      const result = await cartService.addToCart(dryCleaningData);
      
      if (result.success) {
        Alert.alert("Success!", "Dry cleaning service added to cart!", [
          {
            text: "View Cart",
            onPress: () => router.push("/(tabs)/cart/Cart"),
          },
          {
            text: "Add More",
            onPress: () => {
              setSelectedItem("");
              setQuantity("");
              setSpecialInstructions("");
              setClothingBrand("");
              setImage(null);
              setPickupDate(new Date());
            },
          },
        ]);
      } else {
        throw new Error(result.message || "Failed to add dry cleaning service to cart");
      }
    } catch (error: any) {
      console.error("Add service error:", error);
      Alert.alert(
        "Error", 
        error.message || "Failed to add dry cleaning service. Please try again."
      );
    }
  };

  const handleClose = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      {}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Ionicons name="arrow-back" size={24} color="#5D4037" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🧺 Dry Cleaning Service</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Dry Cleaning Service</Text>
            <Text style={styles.cardSubtitle}>
              We will make it fresh and clean
            </Text>
          </View>

          {}
          <Text style={styles.sectionTitle}>Upload Photo of Garment (Optional)</Text>
          <TouchableOpacity style={styles.imageUpload} onPress={pickImage}>
            {image ? (
              <Image source={{ uri: image }} style={styles.previewImage} />
            ) : (
              <View style={styles.uploadPlaceholder}>
                <Ionicons name="camera-outline" size={40} color="#8D6E63" />
                <Text style={styles.uploadText}>Tap to upload photo of garment</Text>
                <Text style={styles.uploadSubtext}>Clear image helps us serve you better</Text>
              </View>
            )}
          </TouchableOpacity>

          {}
          <Text style={styles.sectionTitle}>Type of Garment *</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={selectedItem}
              onValueChange={(value) => setSelectedItem(value)}
              style={styles.picker}
            >
              <Picker.Item
                label="Select garment type..."
                value=""
                color="#999"
              />
              {garmentTypes.map((item) => (
                <Picker.Item label={item} value={item} key={item} />
              ))}
            </Picker>
          </View>
          {selectedItem && (
            <Text style={styles.priceIndicator}>
              Price per item: ₱{getPriceForGarment(selectedItem)}
            </Text>
          )}

          {}
          <Text style={styles.sectionTitle}>Clothing Brand (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter brand name (e.g., Nike, Adidas)"
            placeholderTextColor="#999"
            value={clothingBrand}
            onChangeText={setClothingBrand}
          />

          {}
          <Text style={styles.sectionTitle}>Quantity *</Text>
          <TextInput
            style={styles.input}
            placeholder="Number of items (e.g., 3)"
            placeholderTextColor="#999"
            keyboardType="numeric"
            value={quantity}
            onChangeText={setQuantity}
          />
          {selectedItem && quantity && parseInt(quantity) > 0 && (
            <Text style={styles.totalIndicator}>
              Total: ₱{getPriceForGarment(selectedItem) * parseInt(quantity)}
            </Text>
          )}

          {}
          <Text style={styles.sectionTitle}>Special Instructions (Optional)</Text>
          <TextInput
            placeholder="Any special care instructions..."
            style={styles.textArea}
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
            value={specialInstructions}
            onChangeText={setSpecialInstructions}
            textAlignVertical="top"
          />

          {}
          <Text style={styles.sectionTitle}>Drop off item date *</Text>
          <Text style={styles.sectionSubtitle}>Select a date when the shop is open</Text>
          <TouchableOpacity
            style={styles.datePickerButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={20} color="#8D6E63" />
            <Text style={styles.datePickerText}>
              {pickupDate
                ? pickupDate.toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "Tap to select date"}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#8D6E63" />
          </TouchableOpacity>

          {}
          {pickupDate && (
            <>
              <Text style={styles.sectionTitle}>Select Time Slot *</Text>
              
              {}
              <View style={styles.timeSlotLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, styles.legendDotAvailable]} />
                  <Text style={styles.legendText}>Available</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, styles.legendDotLimited]} />
                  <Text style={styles.legendText}>Limited</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, styles.legendDotFull]} />
                  <Text style={styles.legendText}>Full</Text>
                </View>
              </View>

              {}
              {loadingSlots ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#B8860B" />
                  <Text style={styles.loadingText}>Loading time slots...</Text>
                </View>
              ) : !isShopOpen ? (
                <View style={styles.shopClosedContainer}>
                  <Ionicons name="close-circle" size={40} color="#ef4444" />
                  <Text style={styles.shopClosedText}>
                    The shop is closed on this date. Please select another date.
                  </Text>
                </View>
              ) : timeSlots.length > 0 ? (
                <View style={styles.timeSlotsGrid}>
                  {(() => {
                    
                    const seenTimes = new Set<string>();
                    const uniqueSlots = timeSlots.filter((slot) => {
                      if (seenTimes.has(slot.time_slot)) {
                        return false;
                      }
                      seenTimes.add(slot.time_slot);
                      return true;
                    });
                    
                    return uniqueSlots.map((slot) => (
                      <TouchableOpacity
                        key={slot.slot_id || slot.time_slot}
                        style={[
                          styles.timeSlotButton,
                          styles[`timeSlotButton${slot.status.charAt(0).toUpperCase() + slot.status.slice(1)}`],
                          selectedTimeSlot === slot.time_slot && styles.timeSlotButtonSelected,
                          !slot.isClickable && styles.timeSlotButtonDisabled,
                        ]}
                        onPress={() => {
                          if (slot.isClickable) {
                            setSelectedTimeSlot(slot.time_slot);
                          }
                        }}
                        disabled={!slot.isClickable}
                      >
                        <Text style={styles.slotTime}>{slot.display_time}</Text>
                        <Text style={styles.slotStatus}>
                          {slot.status === 'full' ? 'Fully Booked' : 
                           slot.status === 'limited' ? `${slot.available} LEFT` : 
                           slot.status === 'available' ? `${slot.available} SPOTS` : 'Unavailable'}
                        </Text>
                      </TouchableOpacity>
                    ));
                  })()}
                </View>
              ) : (
                <View style={styles.noSlotsContainer}>
                  <Ionicons name="calendar-outline" size={40} color="#8D6E63" />
                  <Text style={styles.noSlotsText}>
                    No time slots available for this date. Please select another date.
                  </Text>
                </View>
              )}
            </>
          )}

          {}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => router.push("./appointmentSelection")}
            >
              <Ionicons name="arrow-back" size={20} color="#5D4037" />
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleAddService}
            >
              <Ionicons name="cart-outline" size={20} color="#FFF" />
              <Text style={styles.primaryButtonText}>Add to Cart</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {}
      <DateTimePickerModal
        visible={showDatePicker}
        mode="date"
        value={pickupDate}
        minimumDate={new Date()}
        onConfirm={handleDateConfirm}
        onCancel={handlePickerCancel}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8D5C4',
    backgroundColor: '#FFFEF9',
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#5D4037',
  },
  placeholder: {
    width: 36,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E8D5C4',
  },
  cardHeader: {
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8D5C4',
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#5D4037',
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#8D6E63',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#5D4037',
    marginBottom: 12,
    marginTop: 8,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#8D6E63',
    marginBottom: 12,
    marginTop: -4,
  },
  imageUpload: {
    height: 150,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E8D5C4',
    borderStyle: 'dashed',
    overflow: 'hidden',
    marginBottom: 20,
  },
  uploadPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFEF9',
  },
  uploadText: {
    marginTop: 8,
    color: '#8D6E63',
    fontSize: 14,
    fontWeight: '600',
  },
  uploadSubtext: {
    marginTop: 4,
    color: '#8D6E63',
    fontSize: 12,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#E8D5C4',
    borderRadius: 12,
    backgroundColor: '#FFF',
    overflow: 'hidden',
    marginBottom: 16,
  },
  picker: {
    height: 50,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E8D5C4',
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    backgroundColor: '#FFF',
    color: '#333',
    marginBottom: 16,
  },
  priceIndicator: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#B8860B',
    marginBottom: 16,
  },
  totalIndicator: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '700',
    color: '#B8860B',
    marginBottom: 16,
  },
  textArea: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E8D5C4',
    fontSize: 14,
    color: '#333',
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8D5C4',
    borderRadius: 12,
    padding: 14,
    backgroundColor: '#FFF',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  datePickerText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    marginLeft: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#B8860B',
    borderRadius: 25,
    paddingVertical: 14,
    paddingHorizontal: 24,
    gap: 8,
    flex: 1,
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderRadius: 25,
    paddingVertical: 14,
    paddingHorizontal: 24,
    gap: 8,
    borderWidth: 1,
    borderColor: '#5D4037',
  },
  secondaryButtonText: {
    color: '#5D4037',
    fontSize: 16,
    fontWeight: '600',
  },
  
  timeSlotLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 16,
    padding: 12,
    backgroundColor: 'rgba(93, 64, 55, 0.04)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(93, 64, 55, 0.1)',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendDotAvailable: {
    backgroundColor: '#22c55e',
  },
  legendDotLimited: {
    backgroundColor: '#f59e0b',
  },
  legendDotFull: {
    backgroundColor: '#ef4444',
  },
  legendText: {
    fontSize: 13,
    color: '#555',
  },
  timeSlotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
    justifyContent: 'center',
  },
  timeSlotButton: {
    width: (width - 88) / 3, 
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 72,
  },
  timeSlotButtonAvailable: {
    backgroundColor: '#f0fdf4',
    borderColor: '#22c55e',
  },
  timeSlotButtonLimited: {
    backgroundColor: '#fffbeb',
    borderColor: '#f59e0b',
  },
  timeSlotButtonFull: {
    backgroundColor: '#fef2f2',
    borderColor: '#ef4444',
    opacity: 0.75,
  },
  timeSlotButtonInactive: {
    backgroundColor: '#f5f5f5',
    borderColor: '#d4d4d4',
    opacity: 0.6,
  },
  timeSlotButtonSelected: {
    backgroundColor: '#22c55e',
    borderColor: '#15803d',
  },
  timeSlotButtonDisabled: {
    opacity: 0.6,
  },
  slotTime: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  slotStatus: {
    fontSize: 11,
    fontWeight: '500',
    opacity: 0.85,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#8D6E63',
  },
  shopClosedContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fee2e2',
  },
  shopClosedText: {
    marginTop: 12,
    fontSize: 14,
    color: '#991b1b',
    textAlign: 'center',
  },
  noSlotsContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  noSlotsText: {
    marginTop: 12,
    fontSize: 14,
    color: '#8D6E63',
    textAlign: 'center',
  },
});
