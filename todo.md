# Facebook Live Auto Moderator - Project TODO

## Core Features

### 1. Dashboard & Configuration
- [x] Dashboard layout with sidebar navigation
- [x] Facebook Page ID input field
- [x] Facebook Access Token input field
- [x] Session launch/start button
- [x] Session status indicator (active/inactive)
- [ ] Session history view

### 2. Real-time Comment Feed
- [x] Display incoming Facebook Live comments in real-time
- [x] Show user name, message, and timestamp for each comment
- [x] Comment list with scrollable feed
- [x] Visual indicators for comment status (pending, approved, sent, rejected)
- [ ] Comment detail view/expansion

### 3. Live Content Context Panel
- [x] Text input area for live topic/transcript
- [x] Paste functionality for large transcripts
- [x] Context update button
- [x] Character count indicator
- [ ] Context history/versioning
- [ ] Clear context button

### 4. AI-Powered Response Generation
- [x] LLM integration for comment analysis
- [x] Response generation based on live context only
- [x] Validation that response is grounded in provided context
- [x] Response preview before sending
- [ ] Streaming response generation UI

### 5. Comment Classification System
- [x] Classify comments as: question, gratitude, spam, off-topic
- [x] Visual badges/tags for classification
- [ ] Classification confidence display
- [ ] Manual override capability for classification

### 6. Intelligent Prioritization Queue
- [x] Priority ranking algorithm
- [x] Questions related to live topic = highest priority
- [x] Visual queue display
- [ ] Drag-to-reorder functionality (optional)
- [x] Auto-sort based on priority rules

### 7. Auto-Response Workflow
- [x] Toggle per comment: approve/reject generated response
- [ ] Fully automatic mode toggle (global setting)
- [ ] Manual response editing capability
- [x] Response preview before auto-send
- [x] Confirmation dialogs for critical actions
- [ ] Undo/rollback for sent responses (if applicable)

### 8. Response History Log
- [ ] Display all sent replies
- [ ] Show original comment + generated response + status
- [ ] Timestamp for each response
- [ ] Filter by status (sent, rejected, pending)
- [ ] Search/filter responses
- [ ] Export response history

### 9. Multilingual Support
- [x] Auto-detect comment language (Malagasy/French/English)
- [x] Auto-respond in detected language
- [ ] Language confidence display
- [ ] Manual language override per comment
- [ ] Language preference settings

### 10. Moderation Settings Panel
- [x] Spam filter configuration
- [x] Response delay settings (seconds)
- [x] Maximum replies per minute limit
- [x] Blocked keywords list
- [x] Add/remove keywords UI
- [x] Save settings button
- [x] Settings persistence

## Backend Infrastructure

### Database Schema
- [x] Users table (already exists)
- [x] ModerationSessions table (session metadata, FB page ID, access token)
- [x] Comments table (comment data, classification, priority)
- [x] GeneratedResponses table (response text, status, timestamp)
- [x] ModerationSettings table (user preferences, filters, limits)
- [x] ResponseHistory table (audit log of all responses)

### API Procedures (tRPC)
- [x] Create/start moderation session
- [ ] Fetch live comments from Facebook
- [x] Classify comment (AI-powered)
- [x] Generate response (AI-powered)
- [x] Approve/reject response
- [ ] Send response to Facebook
- [ ] Get response history
- [x] Update moderation settings
- [x] Get current session status

### AI Integration
- [x] LLM setup for classification
- [x] LLM setup for response generation
- [x] Language detection model
- [x] Context validation (ensure response grounded in context)
- [x] Prompt engineering for accurate responses

### Language Detection
- [x] Malagasy language detection
- [x] French language detection
- [x] English language detection
- [x] Fallback language handling

## Frontend Components

### Layout & Navigation
- [x] Dashboard layout with sidebar
- [x] Main content area
- [x] Header with session info
- [x] Navigation menu

### Pages/Sections
- [x] Home/Dashboard page
- [x] Active session page
- [x] Settings page
- [ ] History/Analytics page

### Reusable Components
- [ ] CommentCard component
- [ ] ResponsePreview component
- [ ] ClassificationBadge component
- [ ] PriorityIndicator component
- [ ] ContextPanel component
- [ ] SettingsForm component

## Design & Polish

### Visual Design
- [ ] Elegant color palette
- [ ] Sophisticated typography
- [ ] Refined spacing and layout
- [ ] Premium UI components
- [ ] Smooth animations and transitions
- [ ] Dark/light theme support (optional)
- [ ] Responsive design (mobile, tablet, desktop)

### User Experience
- [ ] Loading states for all async operations
- [ ] Error handling and user feedback
- [ ] Toast notifications for actions
- [ ] Confirmation dialogs for critical operations
- [ ] Keyboard shortcuts (optional)
- [ ] Accessibility (WCAG compliance)

## Testing & Quality

### Unit Tests
- [x] Comment classification logic tests
- [x] Response generation validation tests
- [ ] Language detection tests
- [x] Priority queue algorithm tests
- [x] Moderation settings validation tests

### Integration Tests
- [ ] End-to-end session workflow
- [ ] Facebook API integration
- [ ] LLM integration
- [ ] Database operations

## Deployment & Documentation

- [ ] README with setup instructions
- [ ] Environment variables documentation
- [ ] API documentation
- [ ] User guide for moderators
- [ ] Troubleshooting guide

## Notes

- All responses must be strictly grounded in provided live context
- No fabrication or guessing outside provided context
- Language detection and response generation must be automatic
- Premium, polished UI throughout
- Real-time updates where possible

## Test Moderation Feature

### Backend
- [x] Create testModeration tRPC procedure
- [x] Input: sample comment text, optional session context
- [x] Output: classification, priority score, spam detection, language, response preview
- [x] Use current user settings for testing

### Frontend
- [x] Add "Test Moderation" tab to Settings page
- [x] Input field for sample comment
- [x] Optional: select language or let AI detect
- [x] Display results in card format:
  - Classification badge (question/gratitude/spam/off-topic)
  - Priority score visualization
  - Spam detection result
  - Detected language
  - Generated response preview
  - Confidence scores
- [x] Loading state during analysis
- [x] Clear/reset button

### Testing
- [x] Unit tests for testModeration procedure (29 tests)
- [x] Integration tests for testModeration (12 tests)
- [x] Test with various comment types (question, gratitude, spam, off-topic)
- [x] Test with different language inputs (English, French, Malagasy)
- [x] Test language settings respect
- [x] Test auto-approval logic
- [x] All 97 tests passing

## Facebook Live Integration & Real-Time Features

### Facebook API Integration
- [x] Store Facebook Page ID and Access Token securely in database
- [x] Validate Facebook access tokens
- [x] Implement Facebook Graph API client
- [x] Get list of active live videos for a page
- [x] Fetch live comments from Facebook Graph API
- [x] Handle Facebook API rate limiting and errors
- [ ] Implement token refresh mechanism

### Real-Time Comment Listening
- [x] Implement polling mechanism to fetch new comments (every 2-5 seconds)
- [x] Store fetched comments in database with status tracking
- [x] Detect new comments vs already processed ones
- [ ] Handle comment deletions/edits from Facebook
- [ ] Implement WebSocket for real-time updates to frontend
- [ ] Add comment feed refresh in Session page
- [ ] Display live comment count and activity indicator

### Automatic Response Sending
- [x] Implement Facebook API endpoint to post comments/replies
- [x] Queue system for responses to be sent
- [x] Send generated responses to Facebook Live
- [x] Track response sending status (pending, sent, failed)
- [ ] Implement retry logic for failed sends
- [x] Log all sent responses with timestamps
- [x] Handle Facebook API errors gracefully

### Session Management Enhancements
- [ ] Start background job when session begins
- [ ] Stop background job when session ends
- [ ] Pause/resume comment listening
- [ ] Session status indicators (listening, paused, stopped)
- [ ] Live statistics (comments received, responses sent, etc.)

### Error Handling & Monitoring
- [x] Handle network disconnections gracefully
- [x] Implement error logging and notifications
- [ ] Display error messages to user
- [ ] Automatic reconnection logic
- [ ] Session health checks

### Testing
- [x] Unit tests for FacebookClient
- [x] Unit tests for CommentListener (20 tests)
- [x] All 117 tests passing


## Live Dashboard

### Real-Time Statistics
- [x] Display total comments received (live counter)
- [x] Display total responses sent (live counter)
- [x] Display current queue size (pending comments)
- [x] Display auto-approval rate percentage
- [ ] Display response time average
- [ ] Display error rate percentage

### Live Comment Feed
- [x] Real-time comment stream with newest first
- [x] Comment cards with user name, message, timestamp
- [x] Language badge (EN, FR, MG)
- [x] Classification badge (question, gratitude, spam, off-topic)
- [x] Priority indicator (color-coded)
- [x] Spam indicator (red warning)
- [x] Timestamp relative to now (e.g., "2 min ago")
- [ ] Expandable comment details
- [ ] Manual approve/reject buttons per comment

### Live Response Feed
- [x] Real-time response stream showing sent replies
- [ ] Original comment + generated response side-by-side
- [x] Response status indicator (pending, sent, failed)
- [x] Language of response displayed
- [ ] Confidence score visualization
- [x] Timestamp of when response was sent
- [ ] Ability to view Facebook comment ID

### Dashboard Layout
- [x] Split view: left side for incoming comments, right side for responses
- [x] Top stats bar with key metrics
- [x] Pause/resume listening button
- [ ] Clear history button
- [ ] Export data button
- [x] Settings quick access
- [x] Session info (page name, live video title, duration)

### Animations & Polish
- [x] Smooth fade-in for new comments
- [ ] Highlight animation for new responses
- [ ] Status change animations
- [x] Loading skeletons while fetching
- [x] Empty state message when no comments
- [ ] Scroll-to-top button for long feeds

### Performance
- [ ] Virtual scrolling for large comment lists
- [ ] Lazy load older comments
- [x] Debounce real-time updates (2 second refetch interval)
- [ ] Optimize re-renders with React.memo
- [ ] Cache comment data efficiently

### Accessibility
- [ ] Keyboard navigation for comments
- [ ] Screen reader support for status badges
- [ ] ARIA labels for interactive elements
- [ ] High contrast mode support
- [ ] Focus indicators on buttons
