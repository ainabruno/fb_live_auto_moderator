import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import {
  MessageSquare,
  Zap,
  Globe,
  Shield,
  TrendingUp,
  Clock,
} from "lucide-react";

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      setLocation("/dashboard");
    } else {
      window.location.href = getLoginUrl();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-lg text-slate-900">
              FB Live Moderator
            </span>
          </div>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Button onClick={() => setLocation("/dashboard" as any)} size="sm">
                Dashboard
              </Button>
            ) : (
              <Button
                onClick={() => (window.location.href = getLoginUrl())}
                size="sm"
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-5xl sm:text-6xl font-bold text-slate-900 mb-6 leading-tight">
            AI-Powered Facebook Live Moderation
          </h1>
          <p className="text-xl text-slate-600 mb-8 leading-relaxed">
            Automatically classify, prioritize, and respond to live comments in real-time. 
            Let AI handle the moderation while you focus on your audience.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={handleGetStarted}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Get Started Free
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-slate-300 hover:bg-slate-50"
            >
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Powerful Features
          </h2>
          <p className="text-lg text-slate-600">
            Everything you need to manage live comments effortlessly
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <Card className="border-slate-200 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle className="text-lg">Real-Time Processing</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">
                Analyze and respond to comments instantly as they arrive during your live stream.
              </p>
            </CardContent>
          </Card>

          {/* Feature 2 */}
          <Card className="border-slate-200 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <Globe className="w-6 h-6 text-indigo-600" />
              </div>
              <CardTitle className="text-lg">Multilingual Support</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">
                Auto-detect and respond in Malagasy, French, or English with perfect language matching.
              </p>
            </CardContent>
          </Card>

          {/* Feature 3 */}
          <Card className="border-slate-200 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
              <CardTitle className="text-lg">Smart Classification</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">
                Automatically tag comments as questions, gratitude, spam, or off-topic with high accuracy.
              </p>
            </CardContent>
          </Card>

          {/* Feature 4 */}
          <Card className="border-slate-200 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle className="text-lg">Intelligent Prioritization</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">
                Surface the most important comments first. Questions about your topic get top priority.
              </p>
            </CardContent>
          </Card>

          {/* Feature 5 */}
          <Card className="border-slate-200 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <MessageSquare className="w-6 h-6 text-orange-600" />
              </div>
              <CardTitle className="text-lg">Context-Aware Responses</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">
                Generate responses grounded in your live content. Never fabricate or guess answers.
              </p>
            </CardContent>
          </Card>

          {/* Feature 6 */}
          <Card className="border-slate-200 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-cyan-600" />
              </div>
              <CardTitle className="text-lg">Flexible Approval Workflow</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">
                Review and approve responses before sending, or enable fully automatic mode for hands-free replies.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            How It Works
          </h2>
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          {[
            {
              step: "1",
              title: "Configure Session",
              description: "Enter your Facebook Page ID and access token",
            },
            {
              step: "2",
              title: "Add Live Context",
              description: "Paste your live topic or transcript for AI guidance",
            },
            {
              step: "3",
              title: "AI Analyzes Comments",
              description: "Comments are classified and prioritized automatically",
            },
            {
              step: "4",
              title: "Review & Send",
              description: "Approve responses or let AI send them automatically",
            },
          ].map((item, idx) => (
            <div key={idx} className="relative">
              <div className="bg-white rounded-lg border border-slate-200 p-6 text-center">
                <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-600">{item.description}</p>
              </div>
              {idx < 3 && (
                <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-0.5 bg-gradient-to-r from-blue-600 to-transparent" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-12 text-center text-white">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to Transform Your Live Streams?
          </h2>
          <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
            Start moderating smarter today. No credit card required.
          </p>
          <Button
            size="lg"
            onClick={handleGetStarted}
            className="bg-white text-blue-600 hover:bg-slate-100"
          >
            Get Started Free
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-slate-600">
            <p>&copy; 2026 FB Live Auto Moderator. All rights reserved.</p>
            <div className="flex gap-6 mt-4 sm:mt-0">
              <a href="#" className="hover:text-slate-900">
                Privacy
              </a>
              <a href="#" className="hover:text-slate-900">
                Terms
              </a>
              <a href="#" className="hover:text-slate-900">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
