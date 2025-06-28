import React from "react";
import LinearProgress from "@mui/material/LinearProgress";

const LoadingBar = ({ isLoading, loadingProgress }) => {
  if (!isLoading) return null;

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1001,
        width: "100%",
      }}
    >
      <LinearProgress
        variant="determinate"
        value={loadingProgress}
        color="primary"
        style={{ height: "3px" }}
      />
      <div
        style={{
          textAlign: "center",
          fontSize: "12px",
          padding: "2px",
          backgroundColor: "rgba(0,0,0,0.4)",
          color: "#fff",
        }}
      >
        ກຳລັງໂຫຼດຂໍ້ມູນ... {loadingProgress}%
      </div>
    </div>
  );
};

export default LoadingBar;
