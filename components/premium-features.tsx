"use client"

import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Crown, 
  Infinity, 
  BookOpen, 
  Clock, 
  FileText, 
  Zap,
  Check,
  Star
} from "lucide-react"
import { isPremiumUser } from "@/lib/premium"

interface PremiumFeaturesProps {
  showUpgradeButton?: boolean
  compact?: boolean
}

export function PremiumFeatures({ showUpgradeButton = true, compact = false }: PremiumFeaturesProps) {
  const { data: session } = useSession()
  const isUserPremium = isPremiumUser(session)

  const features = [
    {
      icon: Infinity,
      title: "Unlimited Translations",
      description: "No daily limits on translations",
      free: "50 per day",
      premium: "Unlimited"
    },
    {
      icon: BookOpen,
      title: "Custom Glossaries",
      description: "Create unlimited custom glossaries",
      free: "100 entries",
      premium: "Unlimited"
    },
    {
      icon: Clock,
      title: "Translation History",
      description: "Access your complete translation history",
      free: "7 days",
      premium: "Forever"
    },
    {
      icon: FileText,
      title: "Bulk Translations",
      description: "Translate multiple texts at once",
      free: "10 at once",
      premium: "1000 at once"
    },
    {
      icon: Zap,
      title: "Priority Processing",
      description: "Faster translation processing",
      free: "Standard",
      premium: "Priority"
    },
    {
      icon: Star,
      title: "Advanced Features",
      description: "Domain-specific translations & more",
      free: "Basic",
      premium: "Advanced"
    }
  ]

  if (compact) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Crown className="h-5 w-5 text-yellow-600" />
            <div>
              <p className="font-medium text-gray-900">
                {isUserPremium ? "Premium Active" : "Upgrade to Premium"}
              </p>
              <p className="text-sm text-gray-600">
                {isUserPremium 
                  ? "Enjoy unlimited translations and advanced features" 
                  : "Unlock unlimited translations and premium features"
                }
              </p>
            </div>
          </div>
          {!isUserPremium && showUpgradeButton && (
            <Button size="sm" className="bg-yellow-600 hover:bg-yellow-700">
              Upgrade
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <Crown className="h-6 w-6 text-yellow-600" />
          <CardTitle className="text-2xl font-bold">Premium Features</CardTitle>
        </div>
        <CardDescription>
          {isUserPremium 
            ? "You have access to all premium features"
            : "Upgrade to unlock the full power of Linguala"
          }
        </CardDescription>
        {isUserPremium && (
          <Badge variant="secondary" className="w-fit mx-auto bg-green-100 text-green-800">
            <Check className="h-3 w-3 mr-1" />
            Premium Active
          </Badge>
        )}
      </CardHeader>

      <CardContent>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {features.map((feature, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-2">
                <div className={`p-2 rounded-lg ${isUserPremium ? 'bg-green-100' : 'bg-gray-100'}`}>
                  <feature.icon className={`h-4 w-4 ${isUserPremium ? 'text-green-600' : 'text-gray-600'}`} />
                </div>
                <h3 className="font-medium text-gray-900">{feature.title}</h3>
              </div>
              <p className="text-sm text-gray-600 mb-3">{feature.description}</p>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Free:</span>
                  <span className="font-medium text-gray-700">{feature.free}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-yellow-600">Premium:</span>
                  <span className="font-medium text-yellow-700">{feature.premium}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {!isUserPremium && showUpgradeButton && (
          <div className="text-center space-y-4">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg p-6">
              <h3 className="text-xl font-bold mb-2">Ready to upgrade?</h3>
              <p className="text-blue-100 mb-4">
                Join thousands of users who've unlocked the full potential of Linguala
              </p>
              <Button 
                size="lg" 
                className="bg-white text-blue-600 hover:bg-gray-100 font-semibold"
              >
                <Crown className="h-4 w-4 mr-2" />
                Upgrade to Premium
              </Button>
            </div>
            
            <p className="text-xs text-gray-500">
              30-day money-back guarantee • Cancel anytime • Instant activation
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}