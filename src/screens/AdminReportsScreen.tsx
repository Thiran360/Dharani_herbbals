import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, FileText, Download, BarChart2 } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme/colors';

const REPORTS = [
  { id: 'sales', name: 'Sales Report', endpoint: 'https://api.codingboss.in/herbal/reports/sales/', icon: BarChart2 },
  { id: 'orders', name: 'Orders Report', endpoint: 'https://api.codingboss.in/herbal/reports/orders/', icon: FileText },
  { id: 'customers', name: 'Customers Report', endpoint: 'https://api.codingboss.in/herbal/reports/customers/', icon: FileText },
  { id: 'products', name: 'Products Report', endpoint: 'https://api.codingboss.in/herbal/reports/products/', icon: FileText },
  { id: 'inventory', name: 'Inventory Report', endpoint: 'https://api.codingboss.in/herbal/reports/inventory/', icon: FileText },
];

export default function AdminReportsScreen() {
  const navigation = useNavigation<any>();
  const [activeReport, setActiveReport] = useState<string | null>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchReport = async (report: typeof REPORTS[0]) => {
    setActiveReport(report.id);
    setIsLoading(true);
    setError('');
    setReportData(null);
    try {
      const res = await fetch(report.endpoint);
      const data = await res.json();
      if (!res.ok) throw new Error('Failed to fetch report');
      setReportData(data);
    } catch (e: any) {
      setError(e.message || 'Could not load report data.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>System Reports</Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={styles.container}>
        {/* Reports List */}
        <View style={styles.sidebar}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {REPORTS.map((report) => {
              const Icon = report.icon;
              const isActive = activeReport === report.id;
              return (
                <TouchableOpacity
                  key={report.id}
                  style={[styles.reportTab, isActive && styles.reportTabActive]}
                  onPress={() => fetchReport(report)}
                >
                  <Icon size={20} color={isActive ? colors.primary : '#64748B'} />
                  <Text style={[styles.reportTabText, isActive && styles.reportTabTextActive]}>
                    {report.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Report Content */}
        <View style={styles.content}>
          {!activeReport ? (
            <View style={styles.centered}>
              <BarChart2 size={48} color="#CBD5E1" />
              <Text style={styles.emptyText}>Select a report to view</Text>
            </View>
          ) : isLoading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Generating report...</Text>
            </View>
          ) : error ? (
            <View style={styles.centered}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : (
            <ScrollView style={styles.reportDataContainer}>
              <View style={styles.reportHeader}>
                <Text style={styles.reportTitle}>
                  {REPORTS.find(r => r.id === activeReport)?.name} Data
                </Text>
                <TouchableOpacity style={styles.downloadBtn}>
                  <Download size={16} color={colors.primary} />
                  <Text style={styles.downloadText}>Export</Text>
                </TouchableOpacity>
              </View>
              
              {/* Displaying raw JSON for now as structure varies by report */}
              <View style={styles.jsonContainer}>
                <Text style={styles.jsonText}>{JSON.stringify(reportData, null, 2)}</Text>
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
  container: {
    flex: 1,
    flexDirection: 'column',
  },
  sidebar: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  reportTab: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#F8FAFC',
  },
  reportTabActive: {
    backgroundColor: 'rgba(16,185,129,0.1)',
  },
  reportTabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
    marginLeft: 12,
  },
  reportTabTextActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  content: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#94A3B8',
    fontWeight: '600',
    marginTop: 12,
  },
  loadingText: {
    fontSize: 15,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 12,
  },
  errorText: {
    fontSize: 15,
    color: '#EF4444',
    fontWeight: '500',
    textAlign: 'center',
  },
  reportDataContainer: {
    padding: 20,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16,185,129,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  downloadText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    marginLeft: 6,
  },
  jsonContainer: {
    backgroundColor: '#1E293B',
    padding: 16,
    borderRadius: 16,
  },
  jsonText: {
    color: '#F8FAFC',
    fontFamily: 'monospace',
    fontSize: 13,
  },
});
