import React, { useState, useEffect } from 'react';
import { addDryCleaningToCart, uploadDryCleaningImage } from '../../api/DryCleaningApi';
import { getAvailableSlots, bookSlot, getAllSlotsWithAvailability } from '../../api/AppointmentSlotApi';
import { getAllDCGarmentTypes } from '../../api/DryCleaningGarmentTypeApi';
import '../../styles/DryCleaningFormModal.css';
import '../../styles/SharedModal.css';

const DryCleaningFormModal = ({ isOpen, onClose, onCartUpdate }) => {
  
  const [garmentTypes, setGarmentTypes] = useState({});
  const [garmentTypesList, setGarmentTypesList] = useState([]);

  const [formData, setFormData] = useState({
    serviceName: '',
    brand: '',
    notes: '',
    date: '',
    time: '',
    quantity: 1,
    garmentType: '',
    customGarmentType: ''
  });
  const [allTimeSlots, setAllTimeSlots] = useState([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(true);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState({});
  const [estimatedPrice, setEstimatedPrice] = useState(0);
  const [isEstimatedPrice, setIsEstimatedPrice] = useState(false);
  const [priceLoading, setPriceLoading] = useState(false);
  const [services, setServices] = useState([]);

  useEffect(() => {
    loadGarmentTypes();
  }, []);

  const loadGarmentTypes = async () => {
    try {
      const result = await getAllDCGarmentTypes();
      if (result.success && result.data) {
        
        const typesObj = {};
        result.data.forEach(garment => {
          if (garment.is_active === 1) {
            typesObj[garment.garment_name.toLowerCase()] = parseFloat(garment.garment_price);
          }
        });
        setGarmentTypes(typesObj);
        setGarmentTypesList(result.data.filter(g => g.is_active === 1));
      }
    } catch (err) {
      console.error("Load garment types error:", err);
      
      setGarmentTypes({
        'barong': 200,
        'suits': 200,
        'coat': 300,
        'trousers': 200
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadDryCleaningServices();
      
      setFormData({
        serviceName: '',
        brand: '',
        notes: '',
        date: '',
        time: '',
        quantity: 1,
        garmentType: '',
        customGarmentType: ''
      });
      setAvailableTimeSlots([]);
      setErrors({});
    }
  }, [isOpen]);

  useEffect(() => {
    if (formData.date) {
      loadAvailableSlots(formData.date);

      const refreshInterval = setInterval(() => {
        if (formData.date) {
          
          getAllSlotsWithAvailability('dry_cleaning', formData.date)
            .then((result) => {
              if (result.success && result.slots) {
                
                const currentSlots = JSON.stringify(allTimeSlots.map(s => ({ time: s.time_slot, available: s.available })));
                const newSlots = JSON.stringify(result.slots.map(s => ({ time: s.time_slot, available: s.available })));
                if (currentSlots !== newSlots) {
                  console.log('[POLLING] Slots changed, updating...');
                  if (!result.isShopOpen) {
                    setIsShopOpen(false);
                    setAllTimeSlots([]);
                    setAvailableTimeSlots([]);
                  } else {
                    setIsShopOpen(true);
                    setAllTimeSlots(result.slots || []);
                    const available = (result.slots || [])
                      .filter(slot => slot.isClickable)
                      .map(slot => ({
                        value: slot.time_slot,
                        display: slot.display_time
                      }));
                    setAvailableTimeSlots(available);
                  }
                }
              }
            })
            .catch((error) => {
              console.error('[POLLING] Error refreshing slots:', error);
            });
        }
      }, 5000); 

      return () => clearInterval(refreshInterval);
    } else {
      setAllTimeSlots([]);
      setAvailableTimeSlots([]);
      setIsShopOpen(true);
      setFormData(prev => ({ ...prev, time: '' }));
    }
  }, [formData.date]);

  const loadDryCleaningServices = async () => {
    try {
      
      const { getDryCleaningServices } = await import('../../api/DryCleaningApi');
      const result = await getDryCleaningServices();
      if (result.success && result.data) {
        setServices(result.data);
      }
    } catch (error) {
      console.error('Error loading dry cleaning services:', error);
    }
  };

  const loadAvailableSlots = async (date) => {
    if (!date) return;
    
    setLoadingSlots(true);
    setMessage('');
    
    try {
      
      const result = await getAllSlotsWithAvailability('dry_cleaning', date);
      
      if (result.success) {
        if (!result.isShopOpen) {
          setIsShopOpen(false);
          setAllTimeSlots([]);
          setAvailableTimeSlots([]);
          setMessage('The shop is closed on this date. Please select another date.');
          return;
        }
        
        setIsShopOpen(true);
        setAllTimeSlots(result.slots || []);

        const available = (result.slots || [])
          .filter(slot => slot.isClickable)
          .map(slot => ({
            value: slot.time_slot,
            display: slot.display_time
          }));
        setAvailableTimeSlots(available);
      } else {
        setMessage(result.message || 'Error loading time slots');
        setAllTimeSlots([]);
        setAvailableTimeSlots([]);
      }
    } catch (error) {
      console.error('Error loading available slots:', error);
      setMessage('Error loading available time slots');
      setAllTimeSlots([]);
      setAvailableTimeSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const getMinDate = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    
    if (dayOfWeek === 0) {
      today.setDate(today.getDate() + 1);
    }
    
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleDateChange = async (e) => {
    const selectedDate = e.target.value;
    if (selectedDate) {
      try {
        const { checkDateOpen } = await import('../../api/ShopScheduleApi');
        const result = await checkDateOpen(selectedDate);
        if (!result.success || !result.is_open) {
          setMessage('Appointments are not available on this date. Please select another date.');
          setFormData(prev => ({ ...prev, date: '', time: '' }));
          setErrors(prev => ({ ...prev, date: 'Appointments are not available on this date. Please select another date.' }));
          return;
        }
      } catch (error) {
        console.error('Error checking date availability:', error);
        
        const date = new Date(selectedDate);
        const dayOfWeek = date.getDay();
        if (dayOfWeek === 0) {
          setMessage('Appointments are not available on this date. Please select another date.');
          setFormData(prev => ({ ...prev, date: '', time: '' }));
          setErrors(prev => ({ ...prev, date: 'Appointments are not available on this date. Please select another date.' }));
          return;
        }
      }
    }
    
    setFormData(prev => ({ ...prev, date: selectedDate, time: '' }));
    setMessage('');
    
    if (errors.date) {
      setErrors(prev => ({ ...prev, date: '' }));
    }
  };

  useEffect(() => {
    if (formData.quantity && formData.garmentType) {
      calculatePrice();
    } else {
      setEstimatedPrice(0);
      setIsEstimatedPrice(false);
    }
  }, [formData.quantity, formData.garmentType, formData.customGarmentType, garmentTypesList]);

  const calculatePrice = () => {
    if (!formData.quantity || !formData.garmentType) {
      setEstimatedPrice(0);
      setIsEstimatedPrice(false);
      return;
    }

    const quantity = parseInt(formData.quantity);
    
    if (formData.garmentType === 'others') {
      
      const estimatedPricePerItem = 350;
      const totalPrice = estimatedPricePerItem * quantity;
      setEstimatedPrice(totalPrice);
      setIsEstimatedPrice(true);
    } else {

      const selectedGarment = garmentTypesList.find(g => g.garment_name.toLowerCase() === formData.garmentType);
      const pricePerItem = selectedGarment ? parseFloat(selectedGarment.garment_price) : (garmentTypes[formData.garmentType] || 200);
      const totalPrice = pricePerItem * quantity;
      setEstimatedPrice(totalPrice);
      setIsEstimatedPrice(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImageFile(file);

    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview('');
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.garmentType) {
      newErrors.garmentType = 'Please select a garment type';
    }
    if (formData.garmentType === 'others' && !formData.customGarmentType.trim()) {
      newErrors.customGarmentType = 'Please specify the garment type';
    }
    if (!formData.brand || formData.brand.trim() === '') {
      newErrors.brand = 'Please enter the clothing brand';
    }
    if (!formData.date) {
      newErrors.date = 'Please select a drop off date';
    }
    if (!formData.time) {
      newErrors.time = 'Please select a time slot';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      
      let slotResult = null;
      try {
        slotResult = await bookSlot('dry_cleaning', formData.date, formData.time);
        if (!slotResult || !slotResult.success) {
          const errorMsg = slotResult?.message || 'Failed to book appointment slot. This time may already be taken.';
          console.error('Slot booking failed:', slotResult);
          setMessage(errorMsg);
          setLoading(false);
          return;
        }
        console.log('Slot booked successfully:', slotResult);
      } catch (slotError) {
        console.error('Slot booking error:', slotError);
        const errorMsg = slotError.response?.data?.message || slotError.message || 'Failed to book appointment slot. Please try again.';
        setMessage(errorMsg);
        setLoading(false);
        return;
      }

      let imageUrl = '';

      if (imageFile) {
        console.log('Uploading image file:', imageFile);
        console.log('File details:', {
          name: imageFile.name,
          size: imageFile.size,
          type: imageFile.type
        });

        const uploadResult = await uploadDryCleaningImage(imageFile);
        console.log('Upload result:', uploadResult);

        if (uploadResult.success) {
          imageUrl = uploadResult.data.url || uploadResult.data.filename || '';
          console.log('Image uploaded successfully, URL:', imageUrl);
        } else {
          console.warn('Image upload failed, continuing without image:', uploadResult.message);
          setMessage(`⚠️ Image upload failed: ${uploadResult.message}. Continuing without image.`);
        }
      } else {
        console.log('No image file provided');
      }

      const defaultService = services && services.length > 0 
        ? (services.find(service => service.service_name === 'Basic Dry Cleaning') || services[0])
        : null;

      const actualGarmentType = formData.garmentType === 'others' 
        ? formData.customGarmentType.trim() 
        : formData.garmentType;

      let pricePerItem = 350; 
      if (formData.garmentType !== 'others') {
        const selectedGarment = garmentTypesList.find(g => g.garment_name.toLowerCase() === formData.garmentType);
        pricePerItem = selectedGarment ? parseFloat(selectedGarment.garment_price) : (garmentTypes[formData.garmentType] || 200);
      }

      const pickupDateTime = `${formData.date}T${formData.time}`;

      const dryCleaningData = {
        serviceId: defaultService?.service_id || 1,
        serviceName: 'Basic Dry Cleaning',
        basePrice: '0', 
        finalPrice: estimatedPrice.toString(),
        quantity: formData.quantity,
        brand: formData.brand,
        notes: formData.notes,
        pickupDate: pickupDateTime,
        imageUrl: imageUrl || 'no-image',
        pricePerItem: pricePerItem.toString(),
        garmentType: actualGarmentType,
        isEstimatedPrice: isEstimatedPrice
      };

      console.log('Dry cleaning data to send:', dryCleaningData);
      console.log('Estimated price:', estimatedPrice);
      console.log('Form data:', formData);

      const result = await addDryCleaningToCart(dryCleaningData);
      console.log('Add to cart result:', result);
      console.log('Result success:', result?.success);
      console.log('Result message:', result?.message);

      if (result && result.success) {
        
        const priceLabel = isEstimatedPrice ? 'Estimated price' : 'Final price';
        setMessage(`✅ Dry cleaning service added to cart! ${priceLabel}: ₱${estimatedPrice}${imageUrl ? ' (Image uploaded)' : ''}`);
        setTimeout(() => {
          onClose();
          if (onCartUpdate) onCartUpdate();
        }, 1500);
      } else {

        console.error('Cart addition failed:', result);
        const errorMessage = result?.message || result?.error || 'Failed to add to cart. Please check console for details.';
        setMessage(`❌ Error: ${errorMessage}`);
        setLoading(false);
      }
    } catch (error) {
      console.error('Submit error:', error);
      console.error('Error details:', error.response?.data);
      setMessage(`❌ Failed to add dry cleaning service: ${error.message || 'Unknown error'}`);
      setLoading(false);
    }
  };

  const handleClose = () => {
    
    setFormData({
      serviceName: '',
      brand: '',
      notes: '',
      date: '',
      time: '',
      quantity: 1,
      garmentType: '',
      customGarmentType: ''
    });
    setImageFile(null);
    setImagePreview('');
    setEstimatedPrice(0);
    setIsEstimatedPrice(false);
    setMessage('');
    setErrors({});
    setAvailableTimeSlots([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay-shared" onClick={handleClose}>
      <div className="modal-container-shared" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-shared">
          <h2 className="modal-title-shared">Dry Cleaning Service</h2>
          <button className="modal-close-shared" onClick={handleClose} aria-label="Close modal">
            ×
          </button>
        </div>

        <div className="modal-content-shared">
          <form onSubmit={handleSubmit}>
            {}
            <div className="form-group-shared">
              <label htmlFor="garmentType" className="form-label-shared">
                👔 Garment Type <span className="required-indicator">*</span>
              </label>
              <select
                id="garmentType"
                name="garmentType"
                value={formData.garmentType}
                onChange={handleInputChange}
                className={`form-select-shared ${errors.garmentType ? 'error' : ''}`}
                required
              >
                <option value="">Select garment type...</option>
                {garmentTypesList.map(garment => (
                  <option key={garment.garment_id} value={garment.garment_name.toLowerCase()}>
                    {garment.garment_name} - ₱{parseFloat(garment.garment_price).toFixed(2)}
                  </option>
                ))}
                <option value="others">Others</option>
              </select>
              {errors.garmentType && (
                <span className="error-message-shared">{errors.garmentType}</span>
              )}
              {formData.garmentType === 'others' && (
                <>
                  <input
                    type="text"
                    name="customGarmentType"
                    value={formData.customGarmentType}
                    onChange={handleInputChange}
                    placeholder="Specify garment type..."
                    className={`form-input-shared ${errors.customGarmentType ? 'error' : ''}`}
                    style={{ marginTop: '12px' }}
                    required
                  />
                  {errors.customGarmentType && (
                    <span className="error-message-shared">{errors.customGarmentType}</span>
                  )}
                </>
              )}
            </div>

            <div className="form-group-shared">
              <label htmlFor="brand" className="form-label-shared">
                🏷️ Clothing Brand <span className="required-indicator">*</span>
              </label>
              <input
                type="text"
                id="brand"
                name="brand"
                value={formData.brand}
                onChange={handleInputChange}
                placeholder="e.g., Gucci, Armani, Zara"
                className={`form-input-shared ${errors.brand ? 'error' : ''}`}
                required
              />
              {errors.brand && (
                <span className="error-message-shared">{errors.brand}</span>
              )}
            </div>

            {}
            <div className="form-group-shared">
              <label htmlFor="quantity" className="form-label-shared">
                📦 Number of Items <span className="required-indicator">*</span>
              </label>
              <input
                type="number"
                id="quantity"
                name="quantity"
                value={formData.quantity}
                onChange={handleInputChange}
                min="1"
                max="50"
                className="form-input-shared"
                required
              />
              <span className="help-text-shared">Enter the number of items to be cleaned</span>
            </div>

            {}
            <div className="form-group-shared">
              <label htmlFor="notes" className="form-label-shared">📝 Special Instructions</label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="e.g., Remove specific stains, handle with care, etc."
                rows="3"
                className="form-textarea-shared"
              />
            </div>

            {}
            <div className="form-group-shared">
              <label htmlFor="date" className="form-label-shared">
                📅 Drop off item date <span className="required-indicator">*</span>
              </label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleDateChange}
                min={getMinDate()}
                className={`form-input-shared ${errors.date ? 'error' : ''}`}
                required
              />
              <span className="help-text-shared">Select a date when the shop is open</span>
              {errors.date && (
                <span className="error-message-shared">{errors.date}</span>
              )}
            </div>

            {}
            {formData.date && (
              <div className="form-group-shared">
                <label className="form-label-shared">
                  🕐 Select Time Slot <span className="required-indicator">*</span>
                </label>
                
                {}
                <div className="time-slot-legend">
                  <div className="legend-item">
                    <span className="legend-dot available"></span>
                    <span>Available</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-dot limited"></span>
                    <span>Limited</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-dot full"></span>
                    <span>Full</span>
                  </div>
                </div>
                
                {loadingSlots ? (
                  <div className="time-slots-loading">
                    <div className="loading-spinner"></div>
                    <span>Loading available time slots...</span>
                  </div>
                ) : !isShopOpen ? (
                  <div className="shop-closed-message">
                    <span className="closed-icon">🚫</span>
                    <p>The shop is closed on this date. Please select another date.</p>
                  </div>
                ) : allTimeSlots.length > 0 ? (
                  <div className="time-slots-grid">
                    {(() => {
                      
                      const seenTimes = new Set();
                      const uniqueSlots = allTimeSlots.filter(slot => {
                        if (seenTimes.has(slot.time_slot)) {
                          return false;
                        }
                        seenTimes.add(slot.time_slot);
                        return true;
                      });
                      
                      return uniqueSlots.map(slot => (
                        <button
                          key={slot.slot_id || slot.time_slot}
                          type="button"
                          className={`time-slot-btn ${slot.status} ${formData.time === slot.time_slot ? 'selected' : ''}`}
                          onClick={() => {
                            if (slot.isClickable) {
                              setFormData(prev => ({ ...prev, time: slot.time_slot }));
                              if (errors.time) {
                                setErrors(prev => ({ ...prev, time: '' }));
                              }
                            }
                          }}
                          disabled={!slot.isClickable}
                          title={slot.statusLabel}
                        >
                          <span className="slot-time">{slot.display_time}</span>
                          <span className="slot-status">
                            {slot.status === 'full' ? 'Fully Booked' : 
                             slot.status === 'limited' ? `${slot.available} left` : 
                             slot.status === 'available' ? `${slot.available} spots` : 'Unavailable'}
                          </span>
                        </button>
                      ));
                    })()}
                  </div>
                ) : (
                  <div className="no-slots-message">
                    <span className="no-slots-icon">📅</span>
                    <p>No time slots available for this date. Please select another date.</p>
                  </div>
                )}
                
                {}
                <input
                  type="hidden"
                  name="time"
                  value={formData.time}
                  required
                />
                
                {formData.time && (
                  <div className="selected-slot-info">
                    ✅ Selected: <strong>{allTimeSlots.find(s => s.time_slot === formData.time)?.display_time}</strong>
                  </div>
                )}
                {errors.time && (
                  <span className="error-message-shared">{errors.time}</span>
                )}
              </div>
            )}

            {}
            <div className="form-group-shared">
              <label htmlFor="image" className="form-label-shared">📷 Upload Clothing Photo (Optional)</label>
              <div className="image-upload-wrapper-shared">
                <input
                  type="file"
                  id="image"
                  name="image"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="file-input-shared"
                />
                <label htmlFor="image" className="upload-button-shared">
                  📷 Choose Photo
                </label>
              </div>

              {}
              {imagePreview && (
                <div className="image-preview-shared">
                  <img src={imagePreview} alt="Clothing preview" />
                  <button
                    type="button"
                    className="remove-image-btn-shared"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview('');
                      document.getElementById('image').value = '';
                    }}
                  >
                    ✕ Remove
                  </button>
                </div>
              )}

              {imageFile && !imagePreview && (
                <div className="help-text-shared" style={{ marginTop: '8px' }}>
                  📎 {imageFile.name}
                </div>
              )}
              <span className="help-text-shared">Photos help us provide better service and accurate pricing</span>
            </div>

            {}
            {estimatedPrice > 0 && formData.garmentType && (
              <div className="price-estimate-shared">
                <h4>{isEstimatedPrice ? 'Estimated Price' : 'Final Price'}</h4>
                {formData.garmentType === 'others' ? (
                  <>
                    <p>Items: {formData.quantity} × ₱350 (estimated)</p>
                    <p><strong>Total: ₱{estimatedPrice} (Estimated)</strong></p>
                  </>
                ) : (
                  <>
                    <p>Garment: {formData.garmentType.charAt(0).toUpperCase() + formData.garmentType.slice(1)}</p>
                    <p>Items: {formData.quantity} × ₱{garmentTypes[formData.garmentType]}</p>
                    <p><strong>Total: ₱{estimatedPrice}</strong></p>
                  </>
                )}
                <p className="estimated-pickup">Drop off item date: {formData.date && formData.time ? `${formData.date} ${formData.time.substring(0, 5)}` : 'Not set'}</p>
              </div>
            )}

            {}
            {message && (
              <div className={`message-shared ${message.includes('✅') ? 'success' : 'error'}`}>
                {message}
              </div>
            )}

            {}
            <div className="modal-footer-shared">
              <button
                type="button"
                className="btn-shared btn-cancel-shared"
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-shared btn-primary-shared"
                disabled={loading}
              >
                {loading ? 'Adding...' : 'Add to Cart'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DryCleaningFormModal;
