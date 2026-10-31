export type Role = 'customer' | 'admin' | 'tester';

export type BookingStatus = 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';

export type PaymentStatus =
  | 'unpaid'
  | 'payment_requested'
  | 'awaiting_verification'
  | 'paid'
  | 'refunded';

export type ReportStatus = 'draft' | 'published';
export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export interface Profile {
  id: string;
  email: string;
  fullName: string;
  displayName: string | null;
  company: string | null;
  phone: string | null;
  role: Role;
  marketingOptIn: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Service {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  pricePence: number;
  durationMinutes: number;
  description: string;
  features: string[];
  active: boolean;
  sortOrder: number;
}

export interface Booking {
  id: string;
  reference: string;
  customerId: string;
  serviceId: string;
  gameName: string;
  gameUrl: string;
  platform: string;
  gameDescription: string;
  requestedDate: string;
  requestedTime: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
  additionalInstructions: string | null;
  status: BookingStatus;
  pricePence: number;
  internalNotes: string | null;
  cancelledReason: string | null;
  createdAt: string;
  updatedAt: string;
  acceptedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  serviceName?: string;
  customerName?: string;
  customerEmail?: string;
  paymentStatus?: PaymentStatus | null;
  paymentLink?: string | null;
  reportStatus?: ReportStatus | null;
  reportId?: string | null;
  testers?: string[];
}

export interface Payment {
  id: string;
  bookingId: string;
  customerId: string;
  amountPence: number;
  currency: string;
  status: PaymentStatus;
  provider: string;
  paymentLink: string | null;
  paymentReference: string | null;
  customerNote: string | null;
  adminNote: string | null;
  paidAt: string | null;
  verifiedAt: string | null;
  refundReference: string | null;
  refundedAt: string | null;
  createdAt: string;
  updatedAt: string;
  bookingReference?: string;
  customerName?: string;
  customerEmail?: string;
  gameName?: string;
}

export interface FeedbackReport {
  id: string;
  bookingId: string;
  customerId: string;
  gameName: string;
  testerName: string;
  platform: string;
  testingDate: string;
  overallImpression: string;
  gameplayExperience: string;
  gameMechanics: string;
  bugsDiscovered: string;
  performanceObservations: string;
  userExperience: string;
  suggestedImprovements: string;
  additionalComments: string | null;
  overallRating: number;
  status: ReportStatus;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  bookingReference?: string;
  customerName?: string;
  customerEmail?: string;
}

export interface Review {
  id: string;
  bookingId: string;
  customerId: string;
  rating: number;
  comment: string;
  displayName: string | null;
  status: ReviewStatus;
  createdAt: string;
  moderatedAt: string | null;
  customerName?: string;
  bookingReference?: string;
}

export interface TesterAssignment {
  id: string;
  bookingId: string;
  testerId: string;
  testerName: string;
  assignedAt: string;
}

export interface AvailabilitySlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  capacity: number;
  isOpen: boolean;
  notes: string | null;
  booked?: number;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'handled';
  createdAt: string;
}

export interface AdminStats {
  totalCustomers: number
  totalBookings: number;
  pendingBookings: number;
  activeBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  revenuePence: number;
  outstandingPence: number;
  awaitingVerification: number;
  pendingReviews: number;
}

export interface BookingFilter {
  status?: BookingStatus;
  search?: string;
  customerId?: string;
  limit?: number;
}
