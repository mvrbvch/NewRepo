import * as React from "react";
import Box from "@mui/material/Box";
import Fab from "@mui/material/Fab";
import AddIcon from "@mui/icons-material/Add";
import { z } from "zod";

export default function FloatingActionButtons({
  onCreateEvent,
}: {
  onCreateEvent: () => void;
}) {
  return (
    <Box
      sx={{ "& > :not(style)": { m: 1 } }}
      style={{
        display: "flex",
        justifyContent: "center",
        position: "absolute",
        right: 0,
        left: 0,
        bottom: 50,
        zIndex: 42,
        margin: "0 auto",
        width: 74,
      }}
    >
      <Fab
        onClick={onCreateEvent}
        sx={[
          {
            color: "#ffffff",
            backgroundColor: "#ee5d60",
          },
          {
            "&:hover": {
              color: "#ffffff",
              backgroundColor: "#ee5d60",
            },
          },
        ]}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
}
