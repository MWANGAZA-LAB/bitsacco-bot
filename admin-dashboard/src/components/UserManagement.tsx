/**
 * User Management Component for Bitsacco WhatsApp Bot Admin
 * Manage user sessions, view user activity, and handle user data
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Chip,
  IconButton,
  Button,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  Alert,
  Tooltip,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Search,
  FilterList,
  MoreVert,
  Person,
  Block,
  Delete,
  Visibility,
  Message,
  Phone,
  AccessTime,
  CheckCircle,
  Cancel,
  Warning,
} from '@mui/icons-material';
import { apiService } from '../services/api';

interface User {
  id: string;
  phoneNumber: string;
  firstName?: string;
  lastName?: string;
  isAuthenticated: boolean;
  currentState: string;
  createdAt: Date;
  lastActivity: Date;
  messageCount: number;
  transactionCount: number;
  status: 'active' | 'inactive' | 'blocked';
}

interface UserActivity {
  id: string;
  type: 'message' | 'transaction' | 'login' | 'logout';
  description: string;
  timestamp: Date;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([
    {
      id: '1',
      phoneNumber: '+254712345678',
      firstName: 'John',
      lastName: 'Doe',
      isAuthenticated: true,
      currentState: 'authenticated',
      createdAt: new Date('2024-01-15'),
      lastActivity: new Date(),
      messageCount: 45,
      transactionCount: 12,
      status: 'active',
    },
    {
      id: '2',
      phoneNumber: '+254723456789',
      firstName: 'Jane',
      lastName: 'Smith',
      isAuthenticated: false,
      currentState: 'waiting_for_otp',
      createdAt: new Date('2024-01-20'),
      lastActivity: new Date(Date.now() - 300000),
      messageCount: 23,
      transactionCount: 5,
      status: 'active',
    },
    {
      id: '3',
      phoneNumber: '+254734567890',
      isAuthenticated: false,
      currentState: 'initial',
      createdAt: new Date('2024-01-25'),
      lastActivity: new Date(Date.now() - 3600000),
      messageCount: 1,
      transactionCount: 0,
      status: 'inactive',
    },
  ]);

  const [filteredUsers, setFilteredUsers] = useState<User[]>(users);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userDetailOpen, setUserDetailOpen] = useState(false);
  const [userActivity, setUserActivity] = useState<UserActivity[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuUserId, setMenuUserId] = useState<string | null>(null);

  useEffect(() => {
    const filtered = users.filter(user =>
      user.phoneNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [users, searchTerm]);

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleUserClick = async (user: User) => {
    setSelectedUser(user);
    setUserDetailOpen(true);

    // Load user activity
    const mockActivity: UserActivity[] = [
      {
        id: '1',
        type: 'message',
        description: 'Sent voice message',
        timestamp: new Date(Date.now() - 300000),
      },
      {
        id: '2',
        type: 'transaction',
        description: 'Transferred KES 500',
        timestamp: new Date(Date.now() - 1800000),
      },
      {
        id: '3',
        type: 'login',
        description: 'Successfully authenticated',
        timestamp: new Date(Date.now() - 3600000),
      },
    ];
    setUserActivity(mockActivity);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, userId: string) => {
    setAnchorEl(event.currentTarget);
    setMenuUserId(userId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuUserId(null);
  };

  const handleUserAction = async (action: string, userId: string) => {
    try {
      switch (action) {
        case 'block':
          setUsers(prev => prev.map(user =>
            user.id === userId ? { ...user, status: 'blocked' as const } : user
          ));
          break;
        case 'unblock':
          setUsers(prev => prev.map(user =>
            user.id === userId ? { ...user, status: 'active' as const } : user
          ));
          break;
        case 'reset':
          setUsers(prev => prev.map(user =>
            user.id === userId ? {
              ...user,
              currentState: 'initial',
              isAuthenticated: false
            } : user
          ));
          break;
        case 'delete':
          setUsers(prev => prev.filter(user => user.id !== userId));
          break;
      }
      console.log(`${action} action performed on user ${userId}`);
    } catch (error) {
      console.error(`Error performing ${action} on user:`, error);
    }
    handleMenuClose();
  };

  const getStatusChip = (status: User['status']) => {
    const colors = {
      active: 'success',
      inactive: 'default',
      blocked: 'error',
    } as const;

    return (
      <Chip
        label={status.charAt(0).toUpperCase() + status.slice(1)}
        color={colors[status]}
        size="small"
      />
    );
  };

  const getStateChip = (state: string, isAuthenticated: boolean) => {
    if (isAuthenticated) {
      return <Chip label="Authenticated" color="success" size="small" />;
    }

    const stateColors: Record<string, 'default' | 'primary' | 'warning'> = {
      initial: 'default',
      waiting_for_otp: 'warning',
      processing: 'primary',
    };

    return (
      <Chip
        label={state.replace('_', ' ').toUpperCase()}
        color={stateColors[state] || 'default'}
        size="small"
      />
    );
  };

  const getActivityIcon = (type: UserActivity['type']) => {
    switch (type) {
      case 'message':
        return <Message />;
      case 'transaction':
        return <CheckCircle />;
      case 'login':
        return <Person />;
      case 'logout':
        return <Cancel />;
      default:
        return <AccessTime />;
    }
  };

  return (
    <Box p={3}>
      <Typography variant="h4" component="h1" gutterBottom>
        User Management
      </Typography>

      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search users by phone number or name..."
                value={searchTerm}
                onChange={handleSearch}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Box display="flex" gap={2}>
                <Button
                  variant="outlined"
                  startIcon={<FilterList />}
                >
                  Filter
                </Button>
                <Button variant="outlined">
                  Export
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Phone Number</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>State</TableCell>
                <TableCell>Last Activity</TableCell>
                <TableCell>Messages</TableCell>
                <TableCell>Transactions</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((user) => (
                  <TableRow
                    key={user.id}
                    sx={{ cursor: 'pointer' }}
                    hover
                    onClick={() => handleUserClick(user)}
                  >
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                          {user.firstName ? user.firstName[0] : user.phoneNumber.slice(-2)}
                        </Avatar>
                        <Box>
                          <Typography variant="body1">
                            {user.firstName && user.lastName
                              ? `${user.firstName} ${user.lastName}`
                              : 'Unknown User'}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            ID: {user.id}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>{user.phoneNumber}</TableCell>
                    <TableCell>{getStatusChip(user.status)}</TableCell>
                    <TableCell>{getStateChip(user.currentState, user.isAuthenticated)}</TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {user.lastActivity.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>{user.messageCount}</TableCell>
                    <TableCell>{user.transactionCount}</TableCell>
                    <TableCell align="right">
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMenuOpen(e, user.id);
                        }}
                      >
                        <MoreVert />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredUsers.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(parseInt(event.target.value, 10));
            setPage(0);
          }}
        />
      </Card>

      {/* User Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleUserAction('reset', menuUserId!)}>
          <AccessTime sx={{ mr: 1 }} /> Reset Session
        </MenuItem>
        <MenuItem onClick={() => handleUserAction('block', menuUserId!)}>
          <Block sx={{ mr: 1 }} /> Block User
        </MenuItem>
        <MenuItem onClick={() => handleUserAction('delete', menuUserId!)}>
          <Delete sx={{ mr: 1 }} /> Delete User
        </MenuItem>
      </Menu>

      {/* User Detail Dialog */}
      <Dialog
        open={userDetailOpen}
        onClose={() => setUserDetailOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          User Details: {selectedUser?.firstName} {selectedUser?.lastName}
        </DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Basic Information
                    </Typography>
                    <Box mb={2}>
                      <Typography variant="body2" color="textSecondary">
                        Phone Number
                      </Typography>
                      <Typography variant="body1">
                        {selectedUser.phoneNumber}
                      </Typography>
                    </Box>
                    <Box mb={2}>
                      <Typography variant="body2" color="textSecondary">
                        Registration Date
                      </Typography>
                      <Typography variant="body1">
                        {selectedUser.createdAt.toLocaleDateString()}
                      </Typography>
                    </Box>
                    <Box mb={2}>
                      <Typography variant="body2" color="textSecondary">
                        Status
                      </Typography>
                      {getStatusChip(selectedUser.status)}
                    </Box>
                    <Box>
                      <Typography variant="body2" color="textSecondary">
                        Authentication State
                      </Typography>
                      {getStateChip(selectedUser.currentState, selectedUser.isAuthenticated)}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Activity Summary
                    </Typography>
                    <Box mb={2}>
                      <Typography variant="body2" color="textSecondary">
                        Total Messages
                      </Typography>
                      <Typography variant="h4">
                        {selectedUser.messageCount}
                      </Typography>
                    </Box>
                    <Box mb={2}>
                      <Typography variant="body2" color="textSecondary">
                        Total Transactions
                      </Typography>
                      <Typography variant="h4">
                        {selectedUser.transactionCount}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="textSecondary">
                        Last Activity
                      </Typography>
                      <Typography variant="body1">
                        {selectedUser.lastActivity.toLocaleString()}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Recent Activity
                    </Typography>
                    <List>
                      {userActivity.map((activity, index) => (
                        <React.Fragment key={activity.id}>
                          <ListItem>
                            <ListItemAvatar>
                              <Avatar>{getActivityIcon(activity.type)}</Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={activity.description}
                              secondary={activity.timestamp.toLocaleString()}
                            />
                          </ListItem>
                          {index < userActivity.length - 1 && <Divider />}
                        </React.Fragment>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUserDetailOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement;
