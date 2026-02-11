import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Privacy() {
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

        <h1 className="text-3xl font-medium mb-2">privacy policy</h1>
        <p className="text-sm text-muted-foreground mb-8">effective date: january 1, 2025</p>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-lg font-medium mb-3">1. information we collect</h2>
            <p className="text-muted-foreground leading-relaxed">
              we collect information you provide directly, including your email address 
              and account preferences. we also collect usage data such as trading activity 
              and platform interactions.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium mb-3">2. how we use your information</h2>
            <p className="text-muted-foreground leading-relaxed">
              we use your information to provide and improve our services, personalize 
              your experience, communicate with you about your account, and ensure 
              platform security.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium mb-3">3. data storage and security</h2>
            <p className="text-muted-foreground leading-relaxed">
              your data is stored securely using industry-standard encryption. we implement 
              appropriate technical and organizational measures to protect your personal 
              information.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium mb-3">4. data sharing</h2>
            <p className="text-muted-foreground leading-relaxed">
              we do not sell your personal information. we may share data with service 
              providers who assist in operating our platform, subject to confidentiality 
              obligations.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium mb-3">5. your rights</h2>
            <p className="text-muted-foreground leading-relaxed">
              you have the right to access, correct, or delete your personal information. 
              you may also request a copy of your data or object to certain processing 
              activities.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium mb-3">6. cookies and tracking</h2>
            <p className="text-muted-foreground leading-relaxed">
              we use cookies and similar technologies to enhance your experience and 
              analyze platform usage. see our cookie policy for more details.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium mb-3">7. third-party services</h2>
            <p className="text-muted-foreground leading-relaxed">
              our platform may integrate with third-party services for authentication 
              and market data. these services have their own privacy policies.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium mb-3">8. changes to this policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              we may update this privacy policy periodically. we will notify you of 
              significant changes through the platform or via email.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium mb-3">9. contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              for privacy-related inquiries, please contact us through our official channels.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
