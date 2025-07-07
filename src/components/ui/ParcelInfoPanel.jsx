import React from "react"; // import React
import { X } from "lucide-react"; // import X icon ຈາກ lucide-react (ສຳລັບປຸ່ມປິດ)

const ParcelInfoPanel = ({ parcel, onClose }) => {
  // ຮັບ object ຂໍ້ມູນ parcel ແລະ onClose function ຈາກ props
  if (!parcel) return null; // ຖ້າບໍ່ມີຂໍ້ມູນ parcel, ບໍ່ render ອົງປະກອບໃດໆ

  return (
    // ສ່ວນ UI ຂອງ panel ສະແດງຂໍ້ມູນດິນແຫ່ງ
    <div className="parcel-info-panel">
      <div className="parcel-info-header">
        <h3>ຂໍ້ມູນດິນແຫ່ງ</h3> {/* ຫົວຂໍ້ຂອງ panel */}
        <button onClick={onClose} className="close-button">
          {/* ປຸ່ມສຳລັບປິດ panel */}
          <X size={18} /> {/* icon X */}
        </button>
      </div>

      <div className="parcel-info-content">
        {/* ສ່ວນສະແດງເນື້ອໃນຂໍ້ມູນ */}
        <div className="info-row">
          <span className="info-label">ເລກທີດິນ:</span> {/* ປ້າຍກຳກັບ */}
          <span className="info-value">{parcel.parcelno.trim()}</span>{" "}
          {/* ຄ່າຂອງເລກທີດິນ, trim() ເພື່ອລຶບຊ່ອງວ່າງ */}
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
          <span className="info-value">{parcel.area} ຕລ.ມ.</span>{" "}
          {/* ສະແດງພື້ນທີ່ເປັນຕາແມັດ */}
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
          <span className="info-value">{parcel.owner_count} ຄົນ</span>{" "}
          {/* ສະແດງຈຳນວນເຈົ້າຂອງ */}
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

export default ParcelInfoPanel; // export component
