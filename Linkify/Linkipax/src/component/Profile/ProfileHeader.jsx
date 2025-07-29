import React, { useEffect, useState } from "react";
import axios from "axios";
import { styled } from "@mui/material/styles";
import {
  Avatar,
  Button,
  Chip,
  CircularProgress,
  Container,
  Modal,
  Tooltip,
  Box,
  Alert,
  TextField,
  IconButton,
} from "@mui/material";
import {
  CameraAlt,
  CheckCircle,
  Edit,
  LinkedIn,
  LocationOn,
  People,
  Share,
  Twitter,
  WhatsApp,
  ContentCopy,
} from "@mui/icons-material";

// Styled components using Emotion
const ProfileHeaderContainer = styled(Container)(({ theme }) => ({
  position: "relative",
  borderRadius: theme.shape.borderRadius,
  overflow: "hidden",
  boxShadow: theme.shadows[2],
  backgroundColor: theme.palette.background.paper,
  marginBottom: theme.spacing(3),
  height: "fit-content", // 👈 Ensures it fits content height
  width: "100%",
  display: "block", // or "inline-block" if you want inline behavior
}));

const BackgroundImage = styled("div")(({ theme, backgroundimage }) => ({
  height: 200,
  backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)), url(${backgroundimage})`,
  backgroundSize: "cover",
  backgroundPosition: "center",
  position: "relative",
  [theme.breakpoints.down("sm")]: {
    height: 160,
  },
}));

const CoverPhotoEditButton = styled("label")(({ theme }) => ({
  position: "absolute",
  bottom: theme.spacing(2),
  right: theme.spacing(2),
  backgroundColor: "rgba(255, 255, 255, 0.9)",
  width: 36,
  height: 36,
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  transition: "all 0.2s ease",
  "&:hover": {
    backgroundColor: theme.palette.common.white,
    transform: "scale(1.1)",
  },
}));

const ProfileContent = styled("div")(({ theme }) => ({
  padding: theme.spacing(0, 3, 3),
  position: "relative",
  textAlign: "center",
}));

const AvatarSection = styled("div")(({ theme }) => ({
  marginTop: -60,
  position: "relative",
  display: "inline-block",
}));

const VerifiedBadge = styled("div")(({ theme }) => ({
  position: "absolute",
  bottom: 8,
  right: 8,
  backgroundColor: theme.palette.common.white,
  borderRadius: "50%",
  padding: 4,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
}));

const ProfileName = styled("h1")(({ theme }) => ({
  fontSize: "1.75rem",
  fontWeight: 700,
  margin: theme.spacing(0, 0, 0.5),
  color: theme.palette.text.primary,
  [theme.breakpoints.down("sm")]: {
    fontSize: "1.5rem",
  },
}));

const ProfileTitle = styled("h2")(({ theme }) => ({
  fontSize: "1.1rem",
  fontWeight: 500,
  margin: theme.spacing(0, 0, 1.5),
  color: theme.palette.text.secondary,
  [theme.breakpoints.down("sm")]: {
    fontSize: "1rem",
  },
}));

const ProfileBio = styled("p")(({ theme }) => ({
  fontSize: "0.95rem",
  color: theme.palette.text.secondary,
  maxWidth: 600,
  margin: "0 auto 16px",
  lineHeight: 1.5,
}));

const ProfileMeta = styled("div")(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(1),
  justifyContent: "center",
  marginBottom: theme.spacing(2.5),
}));

const ActionButtons = styled("div")(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(1.5),
  justifyContent: "center",
  marginBottom: theme.spacing(3),
  [theme.breakpoints.down("sm")]: {
    flexDirection: "column",
    alignItems: "center",
  },
}));

const ProfileCompletion = styled("div")(({ theme }) => ({
  maxWidth: 500,
  margin: "0 auto",
}));

const CompletionHeader = styled("div")(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  marginBottom: theme.spacing(1),
  fontSize: "0.85rem",
  color: theme.palette.text.secondary,
}));

const ProgressBarContainer = styled("div")(({ theme }) => ({
  height: 6,
  backgroundColor: theme.palette.grey[200],
  borderRadius: 3,
  overflow: "hidden",
}));

const ProgressBar = styled("div")(({ theme, width }) => ({
  height: "100%",
  background: "linear-gradient(90deg, #4b6cb7 0%, #182848 100%)",
  borderRadius: 3,
  transition: "width 0.5s ease",
  width: `${width}%`,
}));

const ModalContent = styled("div")(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  padding: theme.spacing(3),
  borderRadius: theme.shape.borderRadius,
  maxWidth: 450,
  margin: "0 auto",
  position: "relative",
  top: "50%",
  transform: "translateY(-50%)",
  outline: "none",
}));

const ShareOptions = styled("div")(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: theme.spacing(1.5),
  marginBottom: theme.spacing(2.5),
  [theme.breakpoints.down("sm")]: {
    gridTemplateColumns: "1fr",
  },
}));

const ProfileLinkContainer = styled("div")(({ theme }) => ({
  display: "flex",
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  overflow: "hidden",
}));

const ProfileHeader = ({ userId }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState(
  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await axios.get(
          `${
            import.meta.env.VITE_API_URL
          }/profile/merged-user-details/${userId}`
        );
        setProfile(data);
        setBackgroundImage(
          data.backgroundImage ||
            "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
        );
      } catch (error) {
        setError("Error fetching profile. Please try again.");
        console.error("Profile Fetch Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [userId]);

 const handleBackgroundChange = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("backgroundImage", file);
  formData.append("userId", userId);
  // Add other fields if needed
  formData.append("socialLinks", JSON.stringify(profile?.socialLinks || {}));
  formData.append("interests", JSON.stringify(profile?.interests || []));
  formData.append("achievements", JSON.stringify(profile?.achievements || []));
  formData.append("hobbies", JSON.stringify(profile?.hobbies || []));

  try {
    const response = await axios.post(
      `${import.meta.env.VITE_API_URL}/profile/user-details`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    
    // Update the background image with the secure_url
    setBackgroundImage(response.data.backgroundImage.secure_url);
    
    // Refresh the profile data
    const { data } = await axios.get(
      `${import.meta.env.VITE_API_URL}/profile/merged-user-details/${userId}`
    );
    setProfile(data);
  } catch (error) {
    console.error("Error updating background:", error);
  }
};
  const shareProfile = () => {
    if (!profile) return;

    const shareText = `Check out ${profile.name}'s profile on Linkipax!`;
    const profileURL = `http://localhost:3000/profile/${userId}`;

    if (navigator.share) {
      navigator.share({
        title: "Linkipax Profile",
        text: shareText,
        url: profileURL,
      });
    } else {
      setShowShareModal(true);
    }
  };

  const copyProfileLink = () => {
    const profileURL = `http://localhost:3000/profile/${userId}`;
    navigator.clipboard.writeText(profileURL);
  };

  if (loading)
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height={200}
      >
        <CircularProgress />
      </Box>
    );

  if (error)
    return (
      <Alert severity="error" sx={{ textAlign: "center", my: 2 }}>
        {error}
      </Alert>
    );

  if (!profile) return null;

  return (
    <ProfileHeaderContainer>
      <BackgroundImage backgroundimage={backgroundImage}>
        <Tooltip title="Change cover photo">
          <CoverPhotoEditButton>
            <input
              type="file"
              accept="image/*"
              onChange={handleBackgroundChange}
              style={{ display: "none" }}
            />
            <CameraAlt fontSize="small" />
          </CoverPhotoEditButton>
        </Tooltip>
      </BackgroundImage>

      <ProfileContent>
        <AvatarSection>
          <Avatar
            src={profile.profilePicture}
            alt={profile.name}
            sx={{
              width: 120,
              height: 120,
              border: "4px solid white",
              boxShadow: 3,
            }}
          />
          {profile.isVerified && (
            <VerifiedBadge>
              <CheckCircle fontSize="small" color="primary" />
            </VerifiedBadge>
          )}
        </AvatarSection>

        <ProfileName>{profile.name}</ProfileName>
        <ProfileTitle>{profile.jobTitle}</ProfileTitle>
        <ProfileBio>{profile.bio}</ProfileBio>

        <ProfileMeta>
          <Chip
            icon={<LocationOn fontSize="small" />}
            label={profile.location}
            size="small"
            variant="outlined"
          />
          <Chip
            icon={<People fontSize="small" />}
            label={`${profile.connections.length} connections`}
            size="small"
            variant="outlined"
          />
        </ProfileMeta>

        <ActionButtons>
          <Button
            variant="contained"
            startIcon={<Share />}
            onClick={shareProfile}
            sx={{ borderRadius: "20px" }}
          >
            Share
          </Button>
          <Button
            variant="outlined"
            startIcon={<Edit />}
            sx={{ borderRadius: "20px" }}
          >
            Edit Profile
          </Button>
        </ActionButtons>

        <ProfileCompletion>
          <CompletionHeader>
            <span>Profile Strength</span>
            <span>{profile.profileCompletion}%</span>
          </CompletionHeader>
          <ProgressBarContainer>
            <ProgressBar width={profile.profileCompletion} />
          </ProgressBarContainer>
        </ProfileCompletion>
      </ProfileContent>

      <Modal open={showShareModal} onClose={() => setShowShareModal(false)}>
        <ModalContent>
          <h3
            style={{ marginTop: 0, marginBottom: "20px", textAlign: "center" }}
          >
            Share {profile.name}'s Profile
          </h3>
          <ShareOptions>
            <Button
              variant="contained"
              startIcon={<WhatsApp />}
              onClick={() =>
                window.open(
                  `https://api.whatsapp.com/send?text=${encodeURIComponent(
                    shareText
                  )}%20${encodeURIComponent(profileURL)}`
                )
              }
              sx={{
                backgroundColor: "#25D366",
                "&:hover": { backgroundColor: "#1DA851" },
              }}
            >
              WhatsApp
            </Button>
            <Button
              variant="contained"
              startIcon={<LinkedIn />}
              onClick={() =>
                window.open(
                  `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(
                    profileURL
                  )}`
                )
              }
              sx={{
                backgroundColor: "#0077B5",
                "&:hover": { backgroundColor: "#005582" },
              }}
            >
              LinkedIn
            </Button>
            <Button
              variant="contained"
              startIcon={<Twitter />}
              onClick={() =>
                window.open(
                  `https://twitter.com/intent/tweet?text=${encodeURIComponent(
                    shareText
                  )}&url=${encodeURIComponent(profileURL)}`
                )
              }
              sx={{
                backgroundColor: "#1DA1F2",
                "&:hover": { backgroundColor: "#0d8bd9" },
              }}
            >
              Twitter
            </Button>
          </ShareOptions>
          <ProfileLinkContainer>
            <TextField
              value={`http://localhost:3000/profile/${userId}`}
              fullWidth
              size="small"
              InputProps={{
                readOnly: true,
                sx: { border: 0, "& fieldset": { border: "none" } },
              }}
              onClick={(e) => e.target.select()}
            />
            <Tooltip title="Copy link">
              <IconButton onClick={copyProfileLink}>
                <ContentCopy fontSize="small" />
              </IconButton>
            </Tooltip>
          </ProfileLinkContainer>
        </ModalContent>
      </Modal>
    </ProfileHeaderContainer>
  );
};

export default ProfileHeader;
