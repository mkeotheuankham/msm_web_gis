import React from "react";
import { X } from "lucide-react";

const ParcelInfoPanel = ({ parcel, onClose }) => {
  if (!parcel) return null;

  return (
    <div className="parcel-info-panel">
      <div className="parcel-info-header">
        <h3>ຂໍ້ມູນດິນແຫ່ງ</h3>
        <button onClick={onClose} className="close-button">
          <X size={18} />
        </button>
      </div>

      <div className="parcel-info-content">
        <div className="info-row">
          <span className="info-label">ເລກທີດິນ:</span>
          <span className="info-value">{parcel.parcelno.trim()}</span>
        </div>
        <div className="info-row">
          <span className="info-label">ເລກທີໃບສິດ:</span>
          <span className="info-value">{parcel.titlenumber}</span>
        </div>
        <div className="info-row">
          <span className="info-label">ເມືອງ:</span>
          <span className="info-value">{parcel.district_lao}</span>
        </div>
        <div className="info-row">
          <span className="info-label">ບ້ານ:</span>
          <span className="info-value">{parcel.parcel_village}</span>
        </div>
        <div className="info-row">
          <span className="info-label">ພື້ນທີ່:</span>
          <span className="info-value">{parcel.area} ຕລ.ມ.</span>
        </div>
        <div className="info-row">
          <span className="info-label">ປະເພດການນຳໃຊ້ທີ່ດິນ:</span>
          <span className="info-value">{parcel.landusetype}</span>
        </div>
        <div className="info-row">
          <span className="info-label">ຊື່ເຈົ້າຂອງ:</span>
          <span className="info-value">{parcel.owners}</span>
        </div>
        <div className="info-row">
          <span className="info-label">ຈຳນວນເຈົ້າຂອງ:</span>
          <span className="info-value">{parcel.owner_count} ຄົນ</span>
        </div>
        <div className="info-row">
          <span className="info-label">ວັນທີອອກໃບສິດ:</span>
          <span className="info-value">{parcel.certdate}</span>
        </div>
        <div className="info-row">
          <span className="info-label">ລະບົບພິກັດ:</span>
          <span className="info-value">{parcel.utm_zone}</span>
        </div>
      </div>
    </div>
  );
};

export default ParcelInfoPanel;
