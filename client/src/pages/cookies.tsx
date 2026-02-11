import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Cookies() {
  return (
    <div className="min-h-screen bg-background">
      <div className="noise-overlay" />
      
      <div className="max-w-3xl mx-auto px-4 py-16">
        <Button asChild variant="ghost" size="sm" className="mb-8">
          <Link href="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            back to home
          </Link>
        </Button>

        <h1 className="text-3xl font-medium mb-2">cookie policy</h1>
        <p className="text-sm text-muted-foreground mb-8">effective date: january 1, 2025</p>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-lg font-medium mb-3">1. what are cookies</h2>
            <p className="text-muted-foreground leading-relaxed">
              cookies are small text files stored on your device when you visit a website. 
              they help us remember your preferences and improve your experience.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium mb-3">2. types of cookies we use</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              we use the following types of cookies:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>essential cookies: required for the platform to function properly</li>
              <li>functional cookies: remember your preferences and settings</li>
              <li>analytics cookies: help us understand how you use the platform</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-medium mb-3">3. essential cookies</h2>
            <p className="text-muted-foreground leading-relaxed">
              these cookies are necessary for the platform to work. they enable core 
              functionality such as authentication, session management, and security 
              features.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium mb-3">4. functional cookies</h2>
            <p className="text-muted-foreground leading-relaxed">
              these cookies remember your preferences, such as theme settings and 
              dashboard layout, to provide a personalized experience.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium mb-3">5. analytics cookies</h2>
            <p className="text-muted-foreground leading-relaxed">
              we use analytics cookies to understand how users interact with our 
              platform. this helps us improve features and user experience.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium mb-3">6. managing cookies</h2>
            <p className="text-muted-foreground leading-relaxed">
              you can control cookies through your browser settings. note that 
              disabling certain cookies may affect platform functionality.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium mb-3">7. third-party cookies</h2>
            <p className="text-muted-foreground leading-relaxed">
              some cookies may be set by third-party services we use for authentication 
              and analytics. these services have their own cookie policies.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium mb-3">8. updates to this policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              we may update this cookie policy as our practices change. please review 
              this page periodically for the latest information.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
