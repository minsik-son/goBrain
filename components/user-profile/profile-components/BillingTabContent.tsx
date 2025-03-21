"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { CreditCard, Download, Plus } from "lucide-react"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle
} from "@/components/ui/dialog"
import { useAppSelector } from "@/lib/redux/hooks"

export function BillingTabContent() {
  const userData = useAppSelector(state => state.user)
  const [addCardOpen, setAddCardOpen] = useState(false)
  
  // 샘플 결제 기록 데이터
  const invoices = [
    {
      id: "INV-001",
      date: "May 1, 2023",
      amount: "$9.99",
      status: "Paid",
      paymentMethod: "Visa •••• 4242"
    },
    {
      id: "INV-002",
      date: "April 1, 2023",
      amount: "$9.99",
      status: "Paid",
      paymentMethod: "Visa •••• 4242"
    },
    {
      id: "INV-003",
      date: "March 1, 2023",
      amount: "$9.99",
      status: "Paid",
      paymentMethod: "Visa •••• 4242"
    }
  ]
  
  return (
    <div className="space-y-6 w-full">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Payment Methods</CardTitle>
          <CardDescription>Manage your payment methods and billing preferences</CardDescription>
        </CardHeader>
        <CardContent>
          {userData.plan === "Basic" ? (
            <div className="bg-muted/50 p-4 rounded-lg text-center">
              <p className="text-muted-foreground">
                You're currently on the Basic plan with no payment method required.
              </p>
              <p className="text-sm mt-2">
                Upgrade to a premium plan to add payment methods.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg mb-4">
                <div className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  <div>
                    <p className="font-medium">Visa ending in 4242</p>
                    <p className="text-sm text-muted-foreground">Expires 04/2025</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">Edit</Button>
                  <Button variant="outline" size="sm" className="text-destructive border-destructive">Remove</Button>
                </div>
              </div>
              <Button 
                className="w-full sm:w-auto" 
                variant="outline" 
                onClick={() => setAddCardOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Payment Method
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
          <CardDescription>View and download your past invoices</CardDescription>
        </CardHeader>
        <CardContent>
          {userData.plan === "Basic" ? (
            <div className="bg-muted/50 p-4 rounded-lg text-center">
              <p className="text-muted-foreground">
                No billing history available on the Basic plan.
              </p>
            </div>
          ) : invoices.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell>{invoice.id}</TableCell>
                      <TableCell>{invoice.date}</TableCell>
                      <TableCell>{invoice.amount}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
                          {invoice.status}
                        </span>
                      </TableCell>
                      <TableCell>{invoice.paymentMethod}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="bg-muted/50 p-4 rounded-lg text-center">
              <p className="text-muted-foreground">
                No invoices found.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={addCardOpen} onOpenChange={setAddCardOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Payment Method</DialogTitle>
            <DialogDescription>
              Add a new credit card or debit card to your account.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid w-full items-center gap-2">
              <label htmlFor="card-name" className="text-sm font-medium">
                Cardholder Name
              </label>
              <input
                id="card-name"
                className="p-2 border rounded-md w-full"
                placeholder="John Doe"
              />
            </div>
            <div className="grid w-full items-center gap-2">
              <label htmlFor="card-number" className="text-sm font-medium">
                Card Number
              </label>
              <input
                id="card-number"
                className="p-2 border rounded-md w-full"
                placeholder="4242 4242 4242 4242"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid w-full items-center gap-2">
                <label htmlFor="card-expiry" className="text-sm font-medium">
                  Expiry Date
                </label>
                <input
                  id="card-expiry"
                  className="p-2 border rounded-md w-full"
                  placeholder="MM/YY"
                />
              </div>
              <div className="grid w-full items-center gap-2">
                <label htmlFor="card-cvc" className="text-sm font-medium">
                  CVC
                </label>
                <input
                  id="card-cvc"
                  className="p-2 border rounded-md w-full"
                  placeholder="123"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddCardOpen(false)}>
              Cancel
            </Button>
            <Button>
              Save Card
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 