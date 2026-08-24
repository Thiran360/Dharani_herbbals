import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  ScrollView, 
  Linking,
  Dimensions
} from 'react-native';
import { 
  X, 
  ShieldCheck, 
  FileText, 
  Truck, 
  HelpCircle, 
  Phone, 
  Mail, 
  MapPin, 
  ChevronRight,
  CheckCircle2,
  Lock,
  Headphones,
  RotateCcw,
  Globe,
  UserCheck
} from 'lucide-react-native';
import { colors } from '../theme/colors';

export type PolicyType = 'privacy' | 'terms' | 'shipping' | 'refund' | 'faqs' | 'contact';

interface PolicyModalProps {
  visible: boolean;
  initialPolicy?: PolicyType;
  onClose: () => void;
}

const { width, height } = Dimensions.get('window');

export default function PolicyModal({ visible, initialPolicy = 'privacy', onClose }: PolicyModalProps) {
  const [activeTab, setActiveTab] = useState<PolicyType>(initialPolicy);

  useEffect(() => {
    if (visible && initialPolicy) {
      setActiveTab(initialPolicy);
    }
  }, [visible, initialPolicy]);

  const handleCallSupport1 = () => {
    Linking.openURL('tel:+919788122001');
  };

  const handleCallSupport2 = () => {
    Linking.openURL('tel:+919965532001');
  };

  const handleEmailSupport = () => {
    Linking.openURL('mailto:info@vedanmart.in');
  };

  const handleOpenWebsite = () => {
    Linking.openURL('https://www.vedanmart.com');
  };

  const renderPrivacyPolicy = () => (
    <View style={styles.policyBody}>
      <View style={styles.policyHeaderCard}>
        <ShieldCheck color="#16A34A" size={32} />
        <View style={{ marginLeft: 12, flex: 1 }}>
          <Text style={styles.policyHeaderTitle}>Privacy & Data Protection Policy</Text>
          <Text style={styles.policyHeaderSub}>Official Privacy Policy • Vedan Mart</Text>
        </View>
      </View>

      <Text style={styles.sectionHeading}>1. About Vedan Mart</Text>
      <Text style={styles.paragraphText}>
        At Vedan Mart, we value your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, and safeguard your data when you visit our website or make a purchase.
      </Text>

      <Text style={styles.sectionHeading}>2. Customer/User Information Collection</Text>
      <Text style={styles.paragraphText}>
        We may collect the following information when you use our website or services:
      </Text>
      
      <Text style={styles.subSectionHeading}>A. Personal Information</Text>
      <View style={styles.bulletRow}>
        <CheckCircle2 size={15} color="#16A34A" style={styles.bulletIcon} />
        <Text style={styles.bulletText}>Full Name, Mobile Number, and Email Address</Text>
      </View>
      <View style={styles.bulletRow}>
        <CheckCircle2 size={15} color="#16A34A" style={styles.bulletIcon} />
        <Text style={styles.bulletText}>Billing Address, Shipping Address, State, and PIN Code</Text>
      </View>
      <View style={styles.bulletRow}>
        <CheckCircle2 size={15} color="#16A34A" style={styles.bulletIcon} />
        <Text style={styles.bulletText}>Username and Password (where account registration is available)</Text>
      </View>

      <Text style={styles.subSectionHeading}>B. Order & Payment Information</Text>
      <View style={styles.bulletRow}>
        <CheckCircle2 size={15} color="#16A34A" style={styles.bulletIcon} />
        <Text style={styles.bulletText}>Order Details and Purchased Products</Text>
      </View>
      <View style={styles.bulletRow}>
        <CheckCircle2 size={15} color="#16A34A" style={styles.bulletIcon} />
        <Text style={styles.bulletText}>Transaction Reference Number and Payment Status</Text>
      </View>
      <View style={styles.bulletRow}>
        <CheckCircle2 size={15} color="#16A34A" style={styles.bulletIcon} />
        <Text style={styles.bulletText}>Delivery Preferences</Text>
      </View>

      <Text style={styles.subSectionHeading}>C. Technical Information</Text>
      <Text style={styles.paragraphText}>
        When you access our services, we may automatically collect IP Address, Browser Type, Device Information, Operating System, Device Identifier, Date & Time of Visit, and Website Usage Logs.
      </Text>

      <Text style={styles.subSectionHeading}>D. Website Usage Information</Text>
      <Text style={styles.paragraphText}>
        Products viewed, search history, shopping cart activity, purchase history, login activity, customer support requests, and browsing behavior.
      </Text>

      <Text style={styles.sectionHeading}>3. Use of Information</Text>
      <Text style={styles.paragraphText}>
        The information collected may be used to process & deliver orders, verify payments, manage customer accounts, provide customer support, send invoices and delivery updates, improve website functionality, personalize shopping experience, send promotions (where permitted), prevent fraud, and comply with legal, regulatory, tax, and accounting obligations.
      </Text>

      <Text style={styles.sectionHeading}>4. Third-Party Disclosure</Text>
      <Text style={styles.paragraphText}>
        Vedan Mart does not sell, rent, or trade your personal information. Information is shared only when necessary with Authorized Payment Gateway Providers, Courier and Logistics Partners, Cloud Hosting & IT Providers, Communication Providers, and Government Authorities where required under applicable law.
      </Text>

      <Text style={styles.sectionHeading}>5. Information Protection</Text>
      <Text style={styles.paragraphText}>
        We implement SSL (HTTPS) encryption, secure payment gateway integration, access controls for authorized personnel, regular system monitoring, and administrative safeguards to protect your personal data.
      </Text>

      <Text style={styles.sectionHeading}>6. Rights of Users</Text>
      <Text style={styles.paragraphText}>
        Subject to applicable laws of India, you have the right to access, correct, update, or request deletion of your personal information, as well as withdraw consent for promotional communications.
      </Text>

      <Text style={styles.sectionHeading}>7. Cookies Policy</Text>
      <Text style={styles.paragraphText}>
        Vedan Mart uses cookies to maintain secure login sessions, remember preferences, store shopping cart data, and analyze site performance.
      </Text>

      <Text style={styles.sectionHeading}>8. Data Retention</Text>
      <Text style={styles.paragraphText}>
        We retain personal data only for as long as necessary to fulfill orders, maintain accounts, resolve disputes, and satisfy tax/legal obligations.
      </Text>

      <Text style={styles.sectionHeading}>9. Children's Privacy</Text>
      <Text style={styles.paragraphText}>
        Services are intended for individuals 18 years of age or older. We do not knowingly collect information from children.
      </Text>

      <Text style={styles.sectionHeading}>10. Changes to this Policy</Text>
      <Text style={styles.paragraphText}>
        Vedan Mart reserves the right to update this policy at any time. Updates will be posted on this page.
      </Text>

      <Text style={styles.sectionHeading}>11. Governing Law & Jurisdiction</Text>
      <Text style={styles.paragraphText}>
        Governed by the laws of India, including Digital Personal Data Protection Act, 2023 and IT Act, 2000. Disputes are subject to the exclusive jurisdiction of competent courts in Tamil Nadu, India.
      </Text>
    </View>
  );

  const renderTermsAndConditions = () => (
    <View style={styles.policyBody}>
      <View style={[styles.policyHeaderCard, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
        <FileText color="#2563EB" size={32} />
        <View style={{ marginLeft: 12, flex: 1 }}>
          <Text style={styles.policyHeaderTitle}>Terms & Conditions</Text>
          <Text style={styles.policyHeaderSub}>Official Terms of Service • Vedan Mart</Text>
        </View>
      </View>

      <Text style={styles.sectionHeading}>15. Terms & Conditions</Text>

      <Text style={styles.subSectionHeading}>• Product Information</Text>
      <Text style={styles.paragraphText}>
        We strive to ensure all product descriptions, images, and prices are accurate. However, minor variations may occur.
      </Text>

      <Text style={styles.subSectionHeading}>• Orders & Payments</Text>
      <Text style={styles.paragraphText}>
        All orders are subject to availability and confirmation. Full payment must be completed before order processing.
      </Text>

      <Text style={styles.subSectionHeading}>• Pricing</Text>
      <Text style={styles.paragraphText}>
        Prices are listed in INR (₹) and may be updated without prior notice.
      </Text>

      <Text style={styles.subSectionHeading}>• Shipping & Delivery</Text>
      <Text style={styles.paragraphText}>
        Delivery timelines are estimates and may vary depending on your location and courier services.
      </Text>

      <Text style={styles.subSectionHeading}>• Returns & Refunds</Text>
      <Text style={styles.paragraphText}>
        Returns and refunds are strictly governed by our Return & Refund Policy.
      </Text>

      <Text style={styles.subSectionHeading}>• Intellectual Property</Text>
      <Text style={styles.paragraphText}>
        All website content, text, images, logos, and designs are the property of Vedan Mart and may not be copied or reproduced without permission.
      </Text>

      <Text style={styles.subSectionHeading}>• User Responsibilities</Text>
      <Text style={styles.paragraphText}>
        Users agree to provide accurate information and use the app/website only for lawful purposes.
      </Text>

      <Text style={styles.subSectionHeading}>• Limitation of Liability</Text>
      <Text style={styles.paragraphText}>
        Vedan Mart is not responsible for delays, interruptions, or losses caused by circumstances beyond our control.
      </Text>

      <Text style={styles.subSectionHeading}>• Privacy Compliance</Text>
      <Text style={styles.paragraphText}>
        Your personal information is collected and processed in accordance with our Privacy Policy.
      </Text>

      <Text style={styles.subSectionHeading}>• Changes to Terms</Text>
      <Text style={styles.paragraphText}>
        We reserve the right to modify these Terms & Conditions at any time. Continued use of the service constitutes acceptance of the updated terms.
      </Text>
    </View>
  );

  const renderShippingPolicy = () => (
    <View style={styles.policyBody}>
      <View style={[styles.policyHeaderCard, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}>
        <Truck color="#D97706" size={32} />
        <View style={{ marginLeft: 12, flex: 1 }}>
          <Text style={styles.policyHeaderTitle}>Shipping & Delivery Policy</Text>
          <Text style={styles.policyHeaderSub}>Nationwide Courier Timelines & Dispatches</Text>
        </View>
      </View>

      <Text style={styles.sectionHeading}>13. Shipping & Delivery Policy</Text>
      <Text style={styles.paragraphText}>
        At Vedan Mart, we are committed to delivering your orders accurately, in good condition, and always on time.
      </Text>

      <View style={styles.bulletRow}>
        <CheckCircle2 size={16} color="#D97706" style={styles.bulletIcon} />
        <Text style={styles.bulletText}>
          <Text style={{ fontWeight: '800' }}>Order Processing Time: </Text>
          All orders are processed and dispatched within 1 to 2 business days (excluding Sundays and public holidays) after receiving order confirmation.
        </Text>
      </View>

      <View style={styles.bulletRow}>
        <CheckCircle2 size={16} color="#D97706" style={styles.bulletIcon} />
        <Text style={styles.bulletText}>
          <Text style={{ fontWeight: '800' }}>Delivery Time: </Text>
          Depending on your location within India, delivery usually takes 3 to 7 business days from the date of dispatch.
        </Text>
      </View>

      <View style={styles.bulletRow}>
        <CheckCircle2 size={16} color="#D97706" style={styles.bulletIcon} />
        <Text style={styles.bulletText}>
          <Text style={{ fontWeight: '800' }}>Shipping Charges: </Text>
          Shipping charges for your order are calculated transparently and displayed at checkout.
        </Text>
      </View>

      <View style={styles.bulletRow}>
        <CheckCircle2 size={16} color="#D97706" style={styles.bulletIcon} />
        <Text style={styles.bulletText}>
          <Text style={{ fontWeight: '800' }}>Order Tracking: </Text>
          Once your order has shipped, you will receive an email and/or SMS notification containing your tracking number and live tracking link.
        </Text>
      </View>
    </View>
  );

  const renderRefundPolicy = () => (
    <View style={styles.policyBody}>
      <View style={[styles.policyHeaderCard, { backgroundColor: '#FEE2E2', borderColor: '#FECACA' }]}>
        <RotateCcw color="#EF4444" size={32} />
        <View style={{ marginLeft: 12, flex: 1 }}>
          <Text style={styles.policyHeaderTitle}>Refund & Cancellation Policy</Text>
          <Text style={styles.policyHeaderSub}>Return Verification & Order Cancellation</Text>
        </View>
      </View>

      <Text style={styles.sectionHeading}>12. Refund Policy</Text>
      <Text style={styles.paragraphText}>
        At Vedan Mart, customer satisfaction is important to us. Refunds or replacements will be considered only if the product received is damaged, defective, expired, or incorrect.
      </Text>
      <View style={styles.bulletRow}>
        <CheckCircle2 size={15} color="#EF4444" style={styles.bulletIcon} />
        <Text style={styles.bulletText}>
          <Text style={{ fontWeight: '800' }}>Notification Period: </Text>
          Customers must notify us within 48 hours of receiving the product by providing relevant photographs or proof of purchase.
        </Text>
      </View>
      <View style={styles.bulletRow}>
        <CheckCircle2 size={15} color="#EF4444" style={styles.bulletIcon} />
        <Text style={styles.bulletText}>
          <Text style={{ fontWeight: '800' }}>Processing Time: </Text>
          Once verified and approved, refunds will be processed to the original payment method within 7–10 business days.
        </Text>
      </View>
      <View style={styles.bulletRow}>
        <CheckCircle2 size={15} color="#EF4444" style={styles.bulletIcon} />
        <Text style={styles.bulletText}>
          <Text style={{ fontWeight: '800' }}>Ineligibility: </Text>
          Products that have been opened, used, altered, or damaged due to customer misuse are not eligible for refunds or returns.
        </Text>
      </View>

      <Text style={styles.sectionHeading}>14. Cancellation Policy</Text>
      <Text style={styles.paragraphText}>
        We understand that you may occasionally change your mind about a purchase.
      </Text>
      <View style={styles.bulletRow}>
        <CheckCircle2 size={15} color="#EF4444" style={styles.bulletIcon} />
        <Text style={styles.bulletText}>
          <Text style={{ fontWeight: '800' }}>Before Dispatch: </Text>
          You can cancel your order at any time before it has been dispatched from our warehouse by contacting info@vedanmart.in or calling +91 97881 22001 / +91 99655 32001. A full refund will be initiated to your original payment method within 5–7 business days.
        </Text>
      </View>
      <View style={styles.bulletRow}>
        <CheckCircle2 size={15} color="#EF4444" style={styles.bulletIcon} />
        <Text style={styles.bulletText}>
          <Text style={{ fontWeight: '800' }}>After Dispatch: </Text>
          Once an order has been dispatched or handed over to the courier partner, it cannot be cancelled.
        </Text>
      </View>
    </View>
  );

  const renderFAQs = () => (
    <View style={styles.policyBody}>
      <View style={[styles.policyHeaderCard, { backgroundColor: '#F3E8FF', borderColor: '#E9D5FF' }]}>
        <HelpCircle color="#9333EA" size={32} />
        <View style={{ marginLeft: 12, flex: 1 }}>
          <Text style={styles.policyHeaderTitle}>Frequently Asked Questions</Text>
          <Text style={styles.policyHeaderSub}>Official Vedan Mart Support Information</Text>
        </View>
      </View>

      {/* Official Contact & Inquiry Block ONLY */}
      <View style={styles.faqContactBox}>
        <Text style={styles.faqContactIntro}>
          If you have any questions, concerns, or requests regarding our policies or the handling of your personal information, please contact us:
        </Text>
        <Text style={styles.faqCompanyTitle}>Vedan Mart</Text>
        
        <View style={styles.faqDetailRow}>
          <MapPin color="#D97706" size={18} style={{ marginTop: 2 }} />
          <Text style={styles.faqDetailText}>
            <Text style={{ fontWeight: '700' }}>Registered Office: </Text>
            7/470, West Nehru Nagar, Punjai Puliampatti, Erode, Tamil Nadu, India - 638 459
          </Text>
        </View>

        <View style={styles.faqDetailRow}>
          <UserCheck color="#16A34A" size={18} style={{ marginTop: 2 }} />
          <Text style={styles.faqDetailText}>
            <Text style={{ fontWeight: '700' }}>Founder: </Text>
            A. Poonkodi
          </Text>
        </View>

        <View style={styles.faqDetailRow}>
          <Mail color="#2563EB" size={18} style={{ marginTop: 2 }} />
          <Text style={styles.faqDetailText}>
            <Text style={{ fontWeight: '700' }}>Email: </Text>
            <Text style={styles.linkableTextBlue} onPress={handleEmailSupport}>
              info@vedanmart.in
            </Text>
          </Text>
        </View>

        <View style={styles.faqDetailRow}>
          <Phone color="#D97706" size={18} style={{ marginTop: 2 }} />
          <Text style={styles.faqDetailText}>
            <Text style={{ fontWeight: '700' }}>Phone: </Text>
            <Text style={styles.linkableTextAmber} onPress={handleCallSupport1}>
              +91 97881 22001
            </Text>
            <Text style={{ color: '#64748B' }}> / </Text>
            <Text style={styles.linkableTextAmber} onPress={handleCallSupport2}>
              +91 99655 32001
            </Text>
          </Text>
        </View>

        <View style={styles.faqDetailRow}>
          <Globe color="#9333EA" size={18} style={{ marginTop: 2 }} />
          <Text style={styles.faqDetailText}>
            <Text style={{ fontWeight: '700' }}>Website: </Text>
            <Text style={styles.linkableTextPurple} onPress={handleOpenWebsite}>
              https://www.vedanmart.com
            </Text>
          </Text>
        </View>
      </View>
    </View>
  );

  const renderContactSupport = () => (
    <View style={styles.policyBody}>
      <View style={[styles.policyHeaderCard, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
        <Headphones color={colors.primary} size={32} />
        <View style={{ marginLeft: 12, flex: 1 }}>
          <Text style={styles.policyHeaderTitle}>Contact Vedan Mart</Text>
          <Text style={styles.policyHeaderSub}>Direct Customer Support & Official Registered Office</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.contactActionCard} onPress={handleCallSupport1} activeOpacity={0.85}>
        <View style={[styles.contactActionIconCircle, { backgroundColor: '#DCFCE7' }]}>
          <Phone color="#16A34A" size={22} />
        </View>
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={styles.contactActionTitle}>Primary Support Number</Text>
          <Text style={styles.contactActionSub}>+91 97881 22001</Text>
        </View>
        <ChevronRight color="#94A3B8" size={20} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.contactActionCard} onPress={handleCallSupport2} activeOpacity={0.85}>
        <View style={[styles.contactActionIconCircle, { backgroundColor: '#DCFCE7' }]}>
          <Phone color="#16A34A" size={22} />
        </View>
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={styles.contactActionTitle}>Secondary Support Line</Text>
          <Text style={styles.contactActionSub}>+91 99655 32001</Text>
        </View>
        <ChevronRight color="#94A3B8" size={20} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.contactActionCard} onPress={handleEmailSupport} activeOpacity={0.85}>
        <View style={[styles.contactActionIconCircle, { backgroundColor: '#EFF6FF' }]}>
          <Mail color="#2563EB" size={22} />
        </View>
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={styles.contactActionTitle}>Official Support Email</Text>
          <Text style={styles.contactActionSub}>info@vedanmart.in</Text>
        </View>
        <ChevronRight color="#94A3B8" size={20} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.contactActionCard} onPress={handleOpenWebsite} activeOpacity={0.85}>
        <View style={[styles.contactActionIconCircle, { backgroundColor: '#F3E8FF' }]}>
          <Globe color="#9333EA" size={22} />
        </View>
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={styles.contactActionTitle}>Official Website</Text>
          <Text style={styles.contactActionSub}>https://www.vedanmart.com</Text>
        </View>
        <ChevronRight color="#94A3B8" size={20} />
      </TouchableOpacity>

      <View style={styles.locationCard}>
        <MapPin color="#D97706" size={26} style={{ marginTop: 2 }} />
        <View style={{ marginLeft: 14, flex: 1 }}>
          <Text style={styles.locationTitle}>Registered Office</Text>
          <Text style={styles.locationText}>
            Vedan Mart{"\n"}
            7/470, West Nehru Nagar, Punjai Puliampatti, Erode, Tamil Nadu, India - 638 459
          </Text>
          <View style={styles.founderPill}>
            <UserCheck size={14} color="#92400E" />
            <Text style={styles.founderText}>Founder: A. Poonkodi</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const getHeaderInfo = () => {
    switch (activeTab) {
      case 'privacy':
        return {
          title: 'Privacy Policy',
          sub: 'Vedan Mart Data Protection & Privacy Guidelines',
        };
      case 'terms':
        return {
          title: 'Terms & Conditions',
          sub: 'Official Terms of Use & Order Rules',
        };
      case 'shipping':
        return {
          title: 'Shipping & Delivery Policy',
          sub: 'Courier Timelines & Dispatch Guidelines',
        };
      case 'refund':
        return {
          title: 'Refund & Cancellation Policy',
          sub: 'Return Rules & Cancellation Terms',
        };
      case 'faqs':
        return {
          title: 'Frequently Asked Questions',
          sub: 'Official Answers to Common Questions',
        };
      case 'contact':
        return {
          title: 'Contact Us',
          sub: 'Vedan Mart Support Team & Office',
        };
      default:
        return {
          title: 'Legal Policy',
          sub: 'Vedan Mart Information',
        };
    }
  };

  const headerInfo = getHeaderInfo();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={styles.headerTitle}>{headerInfo.title}</Text>
              <Text style={styles.headerSub}>{headerInfo.sub}</Text>
            </View>
            <TouchableOpacity 
              onPress={onClose} 
              style={styles.closeBtn}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X color="#64748B" size={20} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          {/* Body Content (Shows ONLY the clicked policy) */}
          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {activeTab === 'privacy' && renderPrivacyPolicy()}
            {activeTab === 'terms' && renderTermsAndConditions()}
            {activeTab === 'shipping' && renderShippingPolicy()}
            {activeTab === 'refund' && renderRefundPolicy()}
            {activeTab === 'faqs' && renderFAQs()}
            {activeTab === 'contact' && renderContactSupport()}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: height * 0.90,
    minHeight: height * 0.65,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignSelf: 'flex-start',
  },
  scrollArea: {
    flex: 1,
  },
  policyBody: {
    paddingBottom: 24,
  },
  policyHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  policyHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  policyHeaderSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 16,
    marginBottom: 8,
  },
  subSectionHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 10,
    marginBottom: 6,
  },
  paragraphText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 10,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    paddingRight: 10,
  },
  bulletIcon: {
    marginTop: 3,
    marginRight: 10,
  },
  bulletText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 19,
    flex: 1,
    fontWeight: '500',
  },
  faqCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  faqQuestion: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  faqAnswer: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 19,
  },
  contactActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  contactActionIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactActionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  contactActionSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '600',
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFBEB',
    borderRadius: 18,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  locationTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#92400E',
    marginBottom: 4,
  },
  locationText: {
    fontSize: 13,
    color: '#B45309',
    lineHeight: 19,
  },
  founderPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  founderText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
  },
  faqContactBox: {
    backgroundColor: '#F0FDF4',
    borderRadius: 20,
    padding: 18,
    marginTop: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  faqContactIntro: {
    fontSize: 13,
    color: '#166534',
    lineHeight: 19,
    fontWeight: '500',
    marginBottom: 12,
  },
  faqCompanyTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 10,
  },
  faqDetailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  faqDetailText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 19,
    flex: 1,
  },
  linkableTextBlue: {
    color: '#2563EB',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  linkableTextAmber: {
    color: '#D97706',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  linkableTextPurple: {
    color: '#9333EA',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
