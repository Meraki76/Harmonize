import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Sidebar.css'; // Ensure this is correctly linked

const Sidebar = ({ userProfile, onLogout }) => {
    const navigate = useNavigate();

    const handleProfileClick = (e) => {
        e.preventDefault(); // Prevent the default link behavior
        if (userProfile && userProfile.displayName) {
            navigate(`/profile/${userProfile.displayName}`);
        } else {
            alert('Profile data is not available.');
        }
    };

    const displayName = userProfile ? userProfile.displayName : 'Unknown';
    const email = userProfile ? userProfile.email : 'No email provided';
    const profileImage = userProfile && userProfile.profileImage ? userProfile.profileImage : 'https://via.placeholder.com/150';

    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <img src={profileImage} alt="Profile" className="sidebar-image" />
                <h2 className="sidebar-username">{displayName}</h2>
                <p className="sidebar-email">{email}</p>
            </div>
            <ul className="sidebar-menu">
                <li><a href="/profile" onClick={handleProfileClick}>Profile</a></li> {/* Using 'a' tag with onClick handler for dynamic navigation */}
                <li><Link to="/">Feed</Link></li>
                <li><Link to="/friends">Messages</Link></li>
            </ul>
            <div className="sidebar-footer">
                <a href="#" onClick={onLogout}>Logout</a>
            </div>
        </div>
    );
};

export default Sidebar;
