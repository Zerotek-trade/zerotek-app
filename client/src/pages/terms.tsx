import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Terms() {
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

        <h1 className="text-3xl font-medium mb-2">terms of service</h1>
        <p className="text-sm text-muted-foreground mb-8">effective date: january 1, 2025</p>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-lg font-medium mb-3">1. acceptance of terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              by accessing or using zerotek, you agree to be bound by these terms of service. 
              if you do not agree to these terms, please do not use our platform.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium mb-3">2. description of service</h2>
            <p className="text-muted-foreground leading-relaxed">
              zerotek provides a trading execution platform that allows users to execute 
              perpetual positions using real market data. the platform includes features 
              such as leverage trading, automation rules, and performance analytics.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium mb-3">3. user accounts</h2>
            <p className="text-muted-foreground leading-relaxed">
              you must create an account to access certain features. you are responsible 
              for maintaining the confidentiality of your account credentials and for all 
              activities that occur under your account.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium mb-3">4. internal balance</h2>
            <p className="text-muted-foreground leading-relaxed">
              the balance provided on zerotek is internal to the platform and has no 
              external monetary value. it is provided for the purpose of using the 
              platform's features.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium mb-3">5. acceptable use</h2>
            <p className="text-muted-foreground leading-relaxed">
              you agree not to misuse the platform, including but not limited to: 
              attempting to manipulate the system, using automated tools to gain 
              unfair advantages, or violating any applicable laws.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium mb-3">6. intellectual property</h2>
            <p className="text-muted-foreground leading-relaxed">
              all content, features, and functionality of zerotek are owned by us and 
              are protected by international copyright, trademark, and other intellectual 
              property laws.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium mb-3">7. limitation of liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              zerotek is provided "as is" without warranties of any kind. we shall not 
              be liable for any indirect, incidental, special, consequential, or punitive 
              damages arising from your use of the platform.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium mb-3">8. modifications</h2>
            <p className="text-muted-foreground leading-relaxed">
              we reserve the right to modify these terms at any time. continued use of 
              the platform after changes constitutes acceptance of the modified terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium mb-3">9. contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              for questions about these terms, please contact us through our official channels.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
