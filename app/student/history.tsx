import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  TextInput,
  Modal,
  // Dimensions,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// const { width } = Dimensions.get('window');

const AttendanceHistoryScreen = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all'); // all, present, absent
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [expandedRecord, setExpandedRecord] = useState(null);

  const router = useRouter();

  // Mock data - replace with actual API calls
  const [attendanceHistory] = useState([
    {
      id: 1,
      subject: 'Data Structures',
      lecturer: 'Dr. Smith',
      date: '2025-06-11',
      time: '09:30 AM',
      status: 'present',
      location: 'Room 101',
      duration: '2 hours',
      markedAt: '09:32 AM',
      method: 'QR Code',
      sessionId: 'DS-001-2025',
    },
    {
      id: 2,
      subject: 'Database Systems',
      lecturer: 'Prof. Johnson',
      date: '2025-06-10',
      time: '11:00 AM',
      status: 'present',
      location: 'Lab 204',
      duration: '3 hours',
      markedAt: '11:05 AM',
      method: 'QR Code',
      sessionId: 'DB-002-2025',
    },
    {
      id: 3,
      subject: 'Software Engineering',
      lecturer: 'Dr. Wilson',
      date: '2025-06-10',
      time: '02:00 PM',
      status: 'absent',
      location: 'Room 305',
      duration: '2 hours',
      markedAt: null,
      method: null,
      sessionId: 'SE-003-2025',
    },
    {
      id: 4,
      subject: 'Mathematics',
      lecturer: 'Prof. Davis',
      date: '2025-06-09',
      time: '10:00 AM',
      status: 'present',
      location: 'Room 201',
      duration: '2 hours',
      markedAt: '10:02 AM',
      method: 'QR Code',
      sessionId: 'MATH-004-2025',
    },
    {
      id: 5,
      subject: 'Computer Networks',
      lecturer: 'Prof. Taylor',
      date: '2025-06-08',
      time: '02:30 PM',
      status: 'present',
      location: 'Room 405',
      duration: '2 hours',
      markedAt: '02:35 PM',
      method: 'QR Code',
      sessionId: 'CN-005-2025',
    },
    {
      id: 6,
      subject: 'Operating Systems',
      lecturer: 'Dr. Brown',
      date: '2025-06-07',
      time: '10:00 AM',
      status: 'absent',
      location: 'Lab 301',
      duration: '3 hours',
      markedAt: null,
      method: null,
      sessionId: 'OS-006-2025',
    },
    {
      id: 7,
      subject: 'Data Structures',
      lecturer: 'Dr. Smith',
      date: '2025-06-06',
      time: '09:30 AM',
      status: 'present',
      location: 'Room 101',
      duration: '2 hours',
      markedAt: '09:28 AM',
      method: 'QR Code',
      sessionId: 'DS-007-2025',
    },
    {
      id: 8,
      subject: 'Database Systems',
      lecturer: 'Prof. Johnson',
      date: '2025-06-05',
      time: '11:00 AM',
      status: 'present',
      location: 'Lab 204',
      duration: '3 hours',
      markedAt: '11:10 AM',
      method: 'QR Code',
      sessionId: 'DB-008-2025',
    },
  ]);

  const [monthlyStats] = useState({
    totalClasses: 45,
    attended: 38,
    missed: 7,
    percentage: 84.4,
    bestSubject: 'Database Systems',
    worstSubject: 'Operating Systems',
  });

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = [2023, 2024, 2025];

  useEffect(() => {
    // Filter and search logic would go here
  }, [searchQuery, selectedFilter, selectedMonth, selectedYear]);

  const onRefresh = () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  };

  const getStatusColor = (status:any) => {
    switch (status) {
      case 'present':
        return '#10b981';
      case 'absent':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getStatusIcon = (status:any) => {
    switch (status) {
      case 'present':
        return 'checkmark-circle';
      case 'absent':
        return 'close-circle';
      default:
        return 'help-circle';
    }
  };

  const formatDate = (dateString:Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const filteredHistory = attendanceHistory.filter(record => {
    const matchesSearch = record.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         record.lecturer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || record.status === selectedFilter;
    const recordDate = new Date(record.date);
    const matchesMonth = recordDate.getMonth() === selectedMonth;
    const matchesYear = recordDate.getFullYear() === selectedYear;
    
    return matchesSearch && matchesFilter && matchesMonth && matchesYear;
  });

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={24} color="#1f2937" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Attendance History</Text>
      <TouchableOpacity 
        style={styles.filterButton} 
        onPress={() => setShowFilterModal(true)}
      >
        <Ionicons name="filter" size={24} color="#1f2937" />
      </TouchableOpacity>
    </View>
  );

  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#6b7280" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by subject or lecturer..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#6b7280" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderQuickFilters = () => (
    <View style={styles.quickFiltersContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {['all', 'present', 'absent'].map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.quickFilterButton,
              selectedFilter === filter && styles.activeFilterButton
            ]}
            onPress={() => setSelectedFilter(filter)}
          >
            <Text style={[
              styles.quickFilterText,
              selectedFilter === filter && styles.activeFilterText
            ]}>
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderMonthlyStats = () => (
    <View style={styles.statsContainer}>
      <Text style={styles.statsTitle}>
        {months[selectedMonth]} {selectedYear} Summary
      </Text>
      
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{monthlyStats.totalClasses}</Text>
          <Text style={styles.statLabel}>Total Classes</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#10b981' }]}>
            {monthlyStats.attended}
          </Text>
          <Text style={styles.statLabel}>Attended</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#ef4444' }]}>
            {monthlyStats.missed}
          </Text>
          <Text style={styles.statLabel}>Missed</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#3b82f6' }]}>
            {monthlyStats.percentage}%
          </Text>
          <Text style={styles.statLabel}>Percentage</Text>
        </View>
      </View>
    </View>
  );

  const renderAttendanceRecord = ({ item }: any) => ( // adjust this
    <TouchableOpacity 
      style={styles.recordCard}
      onPress={() => setExpandedRecord(expandedRecord === item.id ? null : item.id)}
    >
      <View style={styles.recordHeader}>
        <View style={styles.recordLeft}>
          <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(item.status) }]} />
          <View style={styles.recordInfo}>
            <Text style={styles.recordSubject}>{item.subject}</Text>
            <Text style={styles.recordLecturer}>{item.lecturer}</Text>
          </View>
        </View>
        <View style={styles.recordRight}>
          <Text style={styles.recordDate}>{formatDate(item.date)}</Text>
          <Text style={styles.recordTime}>{item.time}</Text>
        </View>
      </View>

      {expandedRecord === item.id && (
        <View style={styles.expandedContent}>
          <View style={styles.divider} />
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Ionicons name="location-outline" size={16} color="#6b7280" />
              <Text style={styles.detailText}>{item.location}</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="time-outline" size={16} color="#6b7280" />
              <Text style={styles.detailText}>{item.duration}</Text>
            </View>
            {item.status === 'present' && (
              <>
                <View style={styles.detailItem}>
                  <Ionicons name="checkmark-circle-outline" size={16} color="#10b981" />
                  <Text style={styles.detailText}>Marked at {item.markedAt}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons name="qr-code-outline" size={16} color="#6b7280" />
                  <Text style={styles.detailText}>Via {item.method}</Text>
                </View>
              </>
            )}
            {item.status === 'absent' && (
              <View style={styles.detailItem}>
                <Ionicons name="close-circle-outline" size={16} color="#ef4444" />
                <Text style={styles.detailText}>Attendance not marked</Text>
              </View>
            )}
          </View>
          <Text style={styles.sessionId}>Session ID: {item.sessionId}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderFilterModal = () => (
    <Modal
      visible={showFilterModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowFilterModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter Options</Text>
            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Month</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {months.map((month, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.filterOption,
                    selectedMonth === index && styles.selectedFilterOption
                  ]}
                  onPress={() => setSelectedMonth(index)}
                >
                  <Text style={[
                    styles.filterOptionText,
                    selectedMonth === index && styles.selectedFilterOptionText
                  ]}>
                    {month.slice(0, 3)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Year</Text>
            <View style={styles.yearContainer}>
              {years.map((year) => (
                <TouchableOpacity
                  key={year}
                  style={[
                    styles.filterOption,
                    selectedYear === year && styles.selectedFilterOption
                  ]}
                  onPress={() => setSelectedYear(year)}
                >
                  <Text style={[
                    styles.filterOptionText,
                    selectedYear === year && styles.selectedFilterOptionText
                  ]}>
                    {year}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity 
            style={styles.applyButton}
            onPress={() => setShowFilterModal(false)}
          >
            <Text style={styles.applyButtonText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {renderHeader()}
      {renderSearchBar()}
      {renderQuickFilters()}
      {renderMonthlyStats()}

      <View style={styles.historyContainer}>
        <Text style={styles.historyTitle}>
          Records ({filteredHistory.length})
        </Text>
        
        <FlatList
          data={filteredHistory}
          renderItem={renderAttendanceRecord}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="document-outline" size={60} color="#9ca3af" />
              <Text style={styles.emptyTitle}>No Records Found</Text>
              <Text style={styles.emptyText}>
                Try adjusting your search or filter criteria
              </Text>
            </View>
          }
        />
      </View>

      {renderFilterModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  filterButton: {
    padding: 8,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#ffffff',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#1f2937',
  },
  quickFiltersContainer: {
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: '#ffffff',
  },
  quickFilterButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    marginRight: 10,
  },
  activeFilterButton: {
    backgroundColor: '#3b82f6',
  },
  quickFilterText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  activeFilterText: {
    color: '#ffffff',
  },
  statsContainer: {
    backgroundColor: '#ffffff',
    margin: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
  },
  historyContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 15,
  },
  recordCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recordLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 12,
  },
  recordInfo: {
    flex: 1,
  },
  recordSubject: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  recordLecturer: {
    fontSize: 14,
    color: '#6b7280',
  },
  recordRight: {
    alignItems: 'flex-end',
  },
  recordDate: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 2,
  },
  recordTime: {
    fontSize: 12,
    color: '#6b7280',
  },
  expandedContent: {
    marginTop: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginBottom: 12,
  },
  detailsGrid: {
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
  },
  sessionId: {
    fontSize: 12,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 15,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 30,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  filterSection: {
    marginBottom: 25,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
    marginBottom: 8,
  },
  selectedFilterOption: {
    backgroundColor: '#3b82f6',
  },
  filterOptionText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  selectedFilterOptionText: {
    color: '#ffffff',
  },
  yearContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  applyButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  applyButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AttendanceHistoryScreen;