import React, { useState, useEffect } from 'react';
import { addRepairToCart, uploadRepairImage } from '../../api/RepairApi';
import { getAvailableSlots, bookSlot, getAllSlotsWithAvailability } from '../../api/AppointmentSlotApi';
import { getAllRepairGarmentTypes } from '../../api/RepairGarmentTypeApi';
import '../../styles/RepairFormModal.css';
import '../../styles/SharedModal.css';

const RepairFormModal = ({ isOpen, onClose, onCartUpdate }) => {
  const [formData, setFormData] = useState({
    damageLevel: '',
    garmentType: '',
    notes: '',
    date: '',
    time: ''
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
  const [priceLoading, setPriceLoading] = useState(false);
  const [repairGarmentTypes, setRepairGarmentTypes] = useState([]);

  const damageLevels = [
    { value: 'minor', label: 'Minor', basePrice: 300, description: 'Small tears, loose threads, missing buttons' },
    { value: 'moderate', label: 'Moderate', basePrice: 500, description: 'Broken zippers, medium tears, seam repairs' },
    { value: 'major', label: 'Major', basePrice: 800, description: 'Large tears, structural damage, extensive repairs' },
    { value: 'severe', label: 'Severe', basePrice: 1500, description: 'Complete reconstruction, multiple major issues' }
  ];

  useEffect(() => {
    loadRepairGarmentTypes();
  }, []);

  const loadRepairGarmentTypes = async () => {
    try {
      const result = await getAllRepairGarmentTypes();
      if (result.success && result.garments) {
        setRepairGarmentTypes(result.garments.filter(g => g.is_active === 1));
      } else {
        
        setRepairGarmentTypes([
          { repair_garment_id: 1, garment_name: 'Shirt' },
          { repair_garment_id: 2, garment_name: 'Pants' },
          { repair_garment_id: 3, garment_name: 'Jacket' },
          { repair_garment_id: 4, garment_name: 'Coat' },
          { repair_garment_id: 5, garment_name: 'Dress' },
          { repair_garment_id: 6, garment_name: 'Skirt' },
          { repair_garment_id: 7, garment_name: 'Suit' },
          { repair_garment_id: 8, garment_name: 'Blouse' },
          { repair_garment_id: 9, garment_name: 'Sweater' },
          { repair_garment_id: 10, garment_name: 'Other' }
        ]);
      }
    } catch (err) {
      console.error("Load repair garment types error:", err);
      
      setRepairGarmentTypes([
        { repair_garment_id: 1, garment_name: 'Shirt' },
        { repair_garment_id: 2, garment_name: 'Pants' },
        { repair_garment_id: 3, garment_name: 'Jacket' },
        { repair_garment_id: 4, garment_name: 'Coat' },
        { repair_garment_id: 5, garment_name: 'Dress' },
        { repair_garment_id: 6, garment_name: 'Skirt' },
        { repair_garment_id: 7, garment_name: 'Suit' },
        { repair_garment_id: 8, garment_name: 'Blouse' },
        { repair_garment_id: 9, garment_name: 'Sweater' },
        { repair_garment_id: 10, garment_name: 'Other' }
      ]);
    }
  };

  useEffect(() => {
    if (formData.damageLevel) {
      calculateEstimatedPrice();
    }
  }, [formData.damageLevel, formData.garmentType, repairGarmentTypes]);

  useEffect(() => {
    if (formData.date) {
      loadAvailableSlots(formData.date);

      const refreshInterval = setInterval(() => {
        if (formData.date) {
          
          getAllSlotsWithAvailability('repair', formData.date)
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

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        damageLevel: '',
        garmentType: '',
        notes: '',
        date: '',
        time: ''
      });
      setAllTimeSlots([]);
      setAvailableTimeSlots([]);
      setIsShopOpen(true);
      setImageFile(null);
      setImagePreview('');
      setEstimatedPrice(0);
      setMessage('');
      setErrors({});
    }
  }, [isOpen]);

  const calculateEstimatedPrice = async () => {
    if (!formData.damageLevel) {
      setEstimatedPrice(0);
      return;
    }

    setPriceLoading(true);
    
    try {
      
      const damageLevel = damageLevels.find(level => level.value === formData.damageLevel);
      let basePrice = damageLevel ? damageLevel.basePrice : 500;

      const finalPrice = basePrice;
      setEstimatedPrice(finalPrice);

      try {
        const apiResult = await getPriceEstimate(formData.damageLevel);
        if (apiResult.success && apiResult.data.length > 0) {
          console.log('API price estimate available:', apiResult.data);
        }
      } catch (apiError) {
        console.log('API price estimate not available, using local calculation');
      }
    } catch (error) {
      console.error('Price calculation error:', error);
    } finally {
      setPriceLoading(false);
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

  const loadAvailableSlots = async (date) => {
    if (!date) return;
    
    setLoadingSlots(true);
    setMessage('');
    
    try {
      
      const result = await getAllSlotsWithAvailability('repair', date);
      
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

    if (!formData.damageLevel) {
      newErrors.damageLevel = 'Please select a damage level';
    }
    if (!formData.garmentType) {
      newErrors.garmentType = 'Please select a garment type';
    }
    if (!formData.notes || formData.notes.trim() === '') {
      newErrors.notes = 'Please provide a detailed description';
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
        slotResult = await bookSlot('repair', formData.date, formData.time);
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
        
        const uploadResult = await uploadRepairImage(imageFile);
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

      const pickupDateTime = `${formData.date}T${formData.time}`;

      const repairData = {
        serviceId: 1,
        serviceName: `${formData.damageLevel} Repair`,
        basePrice: estimatedPrice.toString(),
        estimatedPrice: estimatedPrice.toString(),
        damageLevel: formData.damageLevel,
        damageDescription: formData.notes,
        damageLocation: formData.garmentType,
        garmentType: formData.garmentType,
        pickupDate: pickupDateTime,
        imageUrl: imageUrl || 'no-image'
      };

      console.log('Repair data to send:', repairData);

      const result = await addRepairToCart(repairData);
      console.log('Add to cart result:', result);
      
      if (result.success) {
        
        setMessage(`✅ Repair service added to cart! Estimated price: ₱${estimatedPrice}${imageUrl ? ' (Image uploaded)' : ''}`);
        setTimeout(() => {
          onClose();
          if (onCartUpdate) onCartUpdate();
        }, 1500);
      } else {
        console.error('Cart addition failed:', result);
        setMessage(`❌ Error: ${result.message || 'Failed to add to cart. Please try again.'}`);
      }
    } catch (error) {
      console.error('Submit error:', error);
      setMessage('❌ Failed to add repair service');
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  const formatDropOffDate = (dateString) => {
    if (!dateString) return 'Not set';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      return dateString;
    }
  };

  const handleClose = () => {
    setFormData({
      damageLevel: '',
      garmentType: '',
      notes: '',
      datetime: ''
    });
    setImageFile(null);
    setMessage('');
    setEstimatedPrice(0);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay-shared" onClick={handleClose}>
      <div className="modal-container-shared" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-shared">
          <h2 className="modal-title-shared">Repair Service</h2>
          <button className="modal-close-shared" onClick={handleClose} aria-label="Close modal">×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-content-shared">
          <div className="form-group-shared">
            <label htmlFor="damageLevel" className="form-label-shared">
              👔 Damage Level <span className="required-indicator">*</span>
            </label>
            <select
              id="damageLevel"
              name="damageLevel"
              value={formData.damageLevel}
              onChange={handleInputChange}
              className={`form-select-shared ${errors.damageLevel ? 'error' : ''}`}
              required
            >
              <option value="">Select damage level</option>
              {damageLevels.map(level => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
            <div className="help-text-shared" style={{ marginTop: '12px' }}>
              {damageLevels.map(level => (
                <div key={level.value} style={{ marginBottom: '8px' }}>
                  <strong>{level.label}:</strong> {level.description}
                </div>
              ))}
            </div>
            {errors.damageLevel && (
              <span className="error-message-shared">{errors.damageLevel}</span>
            )}
          </div>
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
              <option value="">Select garment type</option>
              {repairGarmentTypes.map(garment => (
                <option key={garment.repair_garment_id} value={garment.garment_name}>
                  {garment.garment_name}
                </option>
              ))}
            </select>
            {errors.garmentType && (
              <span className="error-message-shared">{errors.garmentType}</span>
            )}
          </div>
          <div className="form-group-shared">
            <label htmlFor="notes" className="form-label-shared">
              📝 Detailed Description <span className="required-indicator">*</span>
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="Please describe the damage in detail (size, location, extent of damage)..."
              rows={4}
              className={`form-textarea-shared ${errors.notes ? 'error' : ''}`}
              required
            />
            <span className="help-text-shared">Examples: 2-inch hole in left sleeve, broken zipper on jacket back, torn seam on pants</span>
            {errors.notes && (
              <span className="error-message-shared">{errors.notes}</span>
            )}
          </div>
          <div className="form-group-shared">
            <label htmlFor="image" className="form-label-shared">📷 Upload Damage Photo (Recommended)</label>
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
            {imagePreview && (
              <div className="image-preview-shared">
                <img src={imagePreview} alt="Damage preview" />
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
            <span className="help-text-shared">Photos help us provide accurate pricing and better service</span>
          </div>
          <div className="form-group-shared">
            <label htmlFor="date" className="form-label-shared">
              📅 Drop off date <span className="required-indicator">*</span>
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
          {formData.date && (
            <div className="form-group-shared">
              <label className="form-label-shared">
                🕐 Select Time Slot <span className="required-indicator">*</span>
              </label>
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
          {estimatedPrice > 0 && (
            <div className="price-estimate-shared">
              <h4>Estimated Price: ₱{estimatedPrice}</h4>
              <p>Based on damage level: {formData.damageLevel} • Garment type: {formData.garmentType}</p>
              <p className="estimated-pickup">Drop off item date: {formData.date && formData.time ? formatDropOffDate(`${formData.date}T${formData.time}`) : 'Not set'}</p>
              <p>Final price will be confirmed after admin review</p>
            </div>
          )}

          {message && (
            <div className={`message-shared ${message.includes('✅') ? 'success' : 'error'}`}>
              {message}
            </div>
          )}

          <div className="modal-footer-shared">
            <button type="button" className="btn-shared btn-cancel-shared" onClick={handleClose}>
              Cancel
            </button>
            <button type="submit" className="btn-shared btn-primary-shared" disabled={loading}>
              {loading ? 'Adding...' : 'Add to Cart'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RepairFormModal;
