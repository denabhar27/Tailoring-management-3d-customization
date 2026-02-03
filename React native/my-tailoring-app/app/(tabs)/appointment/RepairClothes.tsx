import React, { useState, useEffect, useCallback } from "react";
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
import { addRepairToCart, uploadRepairImage } from "../../../utils/repairService";
import apiCall, { appointmentSlotService } from "../../../utils/apiService";
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

export default function RepairClothes() {
  const router = useRouter();

  const [image, setImage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState("");
  const [damageLevel, setDamageLevel] = useState("");
  const [description, setDescription] = useState("");
  const [appointmentDate, setAppointmentDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("");
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(true);
  const [estimatedPrice, setEstimatedPrice] = useState(0);
  const [loading, setLoading] = useState(false);

  const damageLevels = [
    { value: 'minor', label: 'Minor', basePrice: 300, description: 'Small tears, loose threads, missing buttons' },
    { value: 'moderate', label: 'Moderate', basePrice: 500, description: 'Broken zippers, medium tears, seam repairs' },
    { value: 'major', label: 'Major', basePrice: 800, description: 'Large tears, structural damage, extensive repairs' },
    { value: 'severe', label: 'Severe', basePrice: 1500, description: 'Complete reconstruction, multiple major issues' }
  ];

  const itemTypes = [
    "Shirt", "Pants", "Jacket", "Coat", "Dress", "Skirt", "Suit", "Blouse", "Sweater", "Other"
  ];

  useEffect(() => {
    if (damageLevel) {
      calculateEstimatedPrice();
    } else {
      setEstimatedPrice(0);
    }
  }, [damageLevel, selectedItem]);

  const calculateEstimatedPrice = async () => {
    if (!damageLevel) {
      setEstimatedPrice(0);
      return;
    }

    const damageLevelObj = damageLevels.find(level => level.value === damageLevel);
    let basePrice = damageLevelObj ? damageLevelObj.basePrice : 500;

    let garmentMultiplier = 1.0;
    if (selectedItem === 'Suit' || selectedItem === 'Coat') {
      garmentMultiplier = 1.3;
    } else if (selectedItem === 'Dress') {
      garmentMultiplier = 1.2;
    }

    const finalPrice = Math.round(basePrice * garmentMultiplier);
    setEstimatedPrice(finalPrice);
  };

  const getEstimatedTime = (damageLevel: string) => {
    const times: {[key: string]: string} = {
      'minor': '2-3 days',
      'moderate': '3-5 days',
      'major': '5-7 days',
      'severe': '1-2 weeks'
    };
    return times[damageLevel] || '3-5 days';
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
      setImagePreview(result.assets[0].uri);
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
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
    
    setAppointmentDate(selectedDate);
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
      const result = await appointmentSlotService.getAllSlotsWithAvailability('repair', dateStr);
      
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
      
      if (appointmentDate) {
        loadTimeSlots(appointmentDate);
      }
    }, [appointmentDate])
  );

  useEffect(() => {
    if (!appointmentDate) return;

    loadTimeSlots(appointmentDate);

    const refreshInterval = setInterval(() => {
      
      const year = appointmentDate.getFullYear();
      const month = String(appointmentDate.getMonth() + 1).padStart(2, '0');
      const day = String(appointmentDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      appointmentSlotService.getAllSlotsWithAvailability('repair', dateStr, 5000)
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
  }, [appointmentDate]); 

  const uploadImageIfNeeded = async () => {
    if (!image) return null;

    try {
      const formData = new FormData();
      formData.append('repairImage', {
        uri: image,
        type: 'image/jpeg',
        name: 'repair-image.jpg',
      } as any);

      const response = await uploadRepairImage(formData);
      const result = await response.json();
      
      if (result.success) {
        return result.data.url || result.data.filename;
      } else {
        throw new Error(result.message || 'Image upload failed');
      }
    } catch (error) {
      console.error('Image upload error:', error);
      throw error;
    }
  };

  const handleAddService = async () => {
    if (!selectedItem || !damageLevel || !description || !appointmentDate) {
      Alert.alert(
        "Missing Information",
        "Please fill in all required fields"
      );
      return;
    }

    if (!selectedTimeSlot) {
      Alert.alert(
        "Missing Information",
        "Please select a time slot"
      );
      return;
    }

    const token = await AsyncStorage.getItem('userToken');
    if (!token) {
      Alert.alert(
        "Authentication Required",
        "Please log in to add items to your cart."
      );
      router.push("/login");
      return;
    }

    setLoading(true);
    
    try {
      
      let slotResult = null;
      try {
        
        const year = appointmentDate.getFullYear();
        const month = String(appointmentDate.getMonth() + 1).padStart(2, '0');
        const day = String(appointmentDate.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        slotResult = await appointmentSlotService.bookSlot('repair', dateStr, selectedTimeSlot);
        if (!slotResult || !slotResult.success) {
          const errorMsg = slotResult?.message || 'Failed to book appointment slot. This time may already be taken.';
          console.error('Slot booking failed:', slotResult);
          Alert.alert('Slot Unavailable', errorMsg);
          setLoading(false);
          return;
        }
        console.log('Slot booked successfully:', slotResult);
      } catch (slotError: any) {
        console.error('Slot booking error:', slotError);
        const errorMsg = slotError.message || 'Failed to book appointment slot. Please try again.';
        Alert.alert('Booking Error', errorMsg);
        setLoading(false);
        return;
      }

      let imageUrl = '';
      if (image) {
        try {
          imageUrl = await uploadImageIfNeeded() || 'no-image';
        } catch (uploadError) {
          console.error('Image upload failed:', uploadError);
          Alert.alert('Warning', 'Image upload failed. Continuing without image.');
        }
      }

      const year = appointmentDate.getFullYear();
      const month = String(appointmentDate.getMonth() + 1).padStart(2, '0');
      const day = String(appointmentDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      const pickupDateTime = `${dateStr}T${selectedTimeSlot}`;

      const repairData = {
        serviceType: 'repair', 
        serviceId: 1, 
        quantity: 1, 
        serviceName: `${damageLevel} Repair`,
        basePrice: estimatedPrice.toString(),
        finalPrice: estimatedPrice.toString(), 
        damageLevel: damageLevel,
        damageDescription: description,
        damageLocation: selectedItem,
        garmentType: selectedItem,
        pickupDate: pickupDateTime, 
        appointmentTime: selectedTimeSlot, 
        imageUrl: imageUrl || 'no-image',
        estimatedTime: getEstimatedTime(damageLevel)
      };

      console.log('Sending repair data to cart:', JSON.stringify(repairData, null, 2));

      const result = await addRepairToCart(repairData);
      
      if (result.success) {
        Alert.alert(
          "Success!", 
          `Repair service added to cart! Estimated price: ₱${estimatedPrice}`, 
          [
            {
              text: "View Cart",
              onPress: () => router.push("/(tabs)/cart/Cart"),
            },
            {
              text: "Add More",
              onPress: () => {
                setSelectedItem("");
                setDamageLevel("");
                setDescription("");
                setImage(null);
                setImagePreview(null);
                setAppointmentDate(null);
                setEstimatedPrice(0);
              },
            },
          ]
        );
      } else {
        throw new Error(result.message || "Failed to add repair service to cart");
      }
    } catch (error: any) {
      console.error("Add service error:", error);
      
      let errorMessage = error.message || "Failed to add repair service. Please try again.";

      if (error.name === 'TypeError' && error.message.includes('Network request failed')) {
        errorMessage = "Network error: Unable to connect to the server. Please check your internet connection and ensure the backend server is running."
      }
      
      Alert.alert(
        "Error Adding to Cart", 
        errorMessage
      );
    } finally {
      setLoading(false);
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
        <Text style={styles.headerTitle}>🔧 Repair Request</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Repair Request</Text>
            <Text style={styles.cardSubtitle}>We'll make it good as new</Text>
          </View>

          {/* Image Upload */}
          <Text style={styles.sectionTitle}>Upload Damage Photo (Recommended)</Text>
          <TouchableOpacity style={styles.imageUpload} onPress={pickImage}>
            {imagePreview ? (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: imagePreview }} style={styles.previewImage} />
                <TouchableOpacity style={styles.removeImageButton} onPress={removeImage}>
                  <Ionicons name="close-circle" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.uploadPlaceholder}>
                <Ionicons name="camera-outline" size={40} color="#8D6E63" />
                <Text style={styles.uploadText}>Tap to upload photo of damage</Text>
                <Text style={styles.uploadSubtext}>Clear image helps us serve you better</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Garment Type */}
          <Text style={styles.sectionTitle}>Garment Type *</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={selectedItem}
              onValueChange={(value) => setSelectedItem(value)}
              style={styles.picker}
            >
              <Picker.Item label="Select garment type..." value="" />
              {itemTypes.map((item) => (
                <Picker.Item label={item} value={item} key={item} />
              ))}
            </Picker>
          </View>

          {/* Damage Level */}
          <Text style={styles.sectionTitle}>Damage Level *</Text>
          <View style={styles.damageLevelContainer}>
            {damageLevels.map((level) => (
              <TouchableOpacity
                key={level.value}
                style={[
                  styles.damageLevelCard,
                  damageLevel === level.value && styles.damageLevelCardSelected,
                ]}
                onPress={() => setDamageLevel(level.value)}
              >
                <View style={styles.damageLevelHeader}>
                  <Text style={[
                    styles.damageLevelLabel,
                    damageLevel === level.value && styles.damageLevelLabelSelected,
                  ]}>
                    {level.label}
                  </Text>
                  {damageLevel === level.value && (
                    <Ionicons name="checkmark-circle" size={20} color="#B8860B" />
                  )}
                </View>
                <Text style={[
                  styles.damageLevelDescription,
                  damageLevel === level.value && styles.damageLevelDescriptionSelected,
                ]}>
                  {level.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {damageLevel && (
            <Text style={styles.priceIndicator}>
              Estimated price: ₱{estimatedPrice}
            </Text>
          )}

          {/* Detailed Description */}
          <Text style={styles.sectionTitle}>Detailed Description *</Text>
          <TextInput
            placeholder="Please describe the damage in detail (size, location, extent of damage)..."
            style={styles.textArea}
            placeholderTextColor="#999"
            multiline
            value={description}
            onChangeText={setDescription}
            textAlignVertical="top"
          />
          <Text style={styles.smallText}>
            Examples: 2-inch hole in left sleeve, broken zipper on jacket back, torn seam on pants
          </Text>

          {/* Appointment Date Picker */}
          <Text style={styles.sectionTitle}>Preferred Appointment Date *</Text>
          <Text style={styles.sectionSubtitle}>Select a date when the shop is open</Text>
          <TouchableOpacity
            style={styles.datePickerButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={20} color="#8D6E63" />
            <Text style={styles.datePickerText}>
              {appointmentDate
                ? appointmentDate.toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "Tap to select date"}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#8D6E63" />
          </TouchableOpacity>

          {/* Time Slot Selection */}
          {appointmentDate && (
            <>
              <Text style={styles.sectionTitle}>Select Time Slot *</Text>
              
              {/* Legend */}
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

              {/* Time Slots Grid */}
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
                    // Deduplicate slots by time_slot to ensure no duplicates are shown
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

          {/* Price Estimate */}
          {estimatedPrice > 0 && (
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Estimated Price: ₱{estimatedPrice}</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Damage Level:</Text>
                <Text style={styles.summaryValue}>{damageLevel}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Garment Type:</Text>
                <Text style={styles.summaryValue}>{selectedItem}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Estimated Time:</Text>
                <Text style={styles.summaryValue}>{getEstimatedTime(damageLevel)}</Text>
              </View>
              <Text style={styles.summaryNote}>
                Final price will be confirmed after admin review
              </Text>
            </View>
          )}

          {/* Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => router.push("./appointmentSelection")}
              disabled={loading}
            >
              <Ionicons name="arrow-back" size={20} color="#5D4037" />
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.primaryButton, (!estimatedPrice || loading) && styles.buttonDisabled]}
              onPress={handleAddService}
              disabled={loading || !estimatedPrice}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Ionicons name="cart-outline" size={20} color="#FFF" />
                  <Text style={styles.primaryButtonText}>
                    Add to Cart - ₱{estimatedPrice || 0}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Date Picker Modal */}
      <DateTimePickerModal
        visible={showDatePicker}
        mode="date"
        value={appointmentDate || new Date()}
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
  imagePreviewContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    padding: 4,
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
  damageLevelContainer: {
    marginBottom: 16,
  },
  damageLevelCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E8D5C4',
  },
  damageLevelCardSelected: {
    borderColor: '#B8860B',
    backgroundColor: '#FFF8E7',
  },
  damageLevelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  damageLevelLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#5D4037',
  },
  damageLevelLabelSelected: {
    color: '#B8860B',
  },
  damageLevelDescription: {
    fontSize: 13,
    color: '#8D6E63',
    lineHeight: 18,
  },
  damageLevelDescriptionSelected: {
    color: '#5D4037',
  },
  priceIndicator: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
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
  smallText: {
    fontSize: 12,
    color: '#8D6E63',
    marginTop: 6,
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
  summaryCard: {
    backgroundColor: '#FFF8E7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E8D5C4',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#5D4037',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#8D6E63',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5D4037',
  },
  summaryNote: {
    fontSize: 12,
    color: '#8D6E63',
    fontStyle: 'italic',
    marginTop: 8,
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
  buttonDisabled: {
    backgroundColor: '#CCC',
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
  // Time Slot Styles
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
    width: (width - 88) / 3, // 3 columns with gaps
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
