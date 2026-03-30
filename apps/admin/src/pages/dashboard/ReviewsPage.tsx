/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from "react";
import { useAxiosPrivate } from "@/hooks/useAxiosPrivate";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, X, Star, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { AxiosError } from "axios";
import ReviewSkeleton from "@/components/skeleton/ReviewSkeleton";

type Review = {
  reviewId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  isApproved: boolean;
  createdAt: string;
  productId: string;
  productName: string;
};

export default function ReviewsPage() {
  const axiosPrivate = useAxiosPrivate();
  const { toast } = useToast();
  const [pendingReviews, setPendingReviews] = useState<Review[]>([]);
  const [approvedReviews, setApprovedReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("pending");

  // Fetch all reviews
  const fetchAllReviews = async () => {
    try {
      setLoading(true);
      const [pendingResponse, approvedResponse] = await Promise.all([
        axiosPrivate.get("/products/reviews/pending"),
        axiosPrivate.get("/products/reviews/approved"),
      ]);
      setPendingReviews(pendingResponse.data || []);
      setApprovedReviews(approvedResponse.data || []);
    } catch (error) {
      const err = error as AxiosError<{ message: string }>;
      toast({
        variant: "destructive",
        title: "Error",
        description: err.response?.data?.message || "Failed to fetch reviews",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllReviews();
  }, []);

  // Approve review
  const handleApprove = async (productId: string, reviewId: string) => {
    try {
      setActionLoading(reviewId);
      await axiosPrivate.put(`/products/${productId}/review/${reviewId}`, {
        approve: true,
      });
      toast({
        title: "Success",
        description: "Review approved successfully",
      });
      // Refresh to get updated lists
      await fetchAllReviews();
    } catch (error) {
      const err = error as AxiosError<{ message: string }>;
      toast({
        variant: "destructive",
        title: "Error",
        description: err.response?.data?.message || "Failed to approve review",
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Delete review (reject pending or delete approved)
  const handleDelete = async (productId: string, reviewId: string) => {
    try {
      setActionLoading(reviewId);
      await axiosPrivate.put(`/products/${productId}/review/${reviewId}`, {
        approve: false,
      });
      toast({
        title: "Success",
        description: "Review deleted successfully",
      });
      // Refresh to get updated lists
      await fetchAllReviews();
      setShowDeleteDialog(false);
      setSelectedReview(null);
    } catch (error) {
      const err = error as AxiosError<{ message: string }>;
      toast({
        variant: "destructive",
        title: "Error",
        description: err.response?.data?.message || "Failed to delete review",
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Render star rating
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            size={16}
            className={
              i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            }
          />
        ))}
        <span className="ml-1 text-sm text-muted-foreground">({rating}/5)</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Product Reviews</h1>
          <p className="text-muted-foreground mt-2">
            Manage customer reviews and feedback
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchAllReviews}
          disabled={loading}
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending">
            Pending ({pendingReviews.length})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved ({approvedReviews.length})
          </TabsTrigger>
        </TabsList>

        {/* Pending Reviews Tab */}
        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pending Reviews</CardTitle>
              <CardDescription>
                Review and approve or reject customer feedback
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <ReviewSkeleton />
              ) : pendingReviews.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    No pending reviews at the moment
                  </p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead>Comment</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingReviews.map((review) => (
                        <TableRow key={review.reviewId}>
                          <TableCell className="font-medium">
                            {review.productName}
                          </TableCell>
                          <TableCell>{review.userName}</TableCell>
                          <TableCell>{renderStars(review.rating)}</TableCell>
                          <TableCell className="max-w-md">
                            <p className="line-clamp-2 text-sm">
                              {review.comment}
                            </p>
                          </TableCell>
                          <TableCell>
                            {new Date(review.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() =>
                                  handleApprove(
                                    review.productId,
                                    review.reviewId
                                  )
                                }
                                disabled={actionLoading === review.reviewId}
                              >
                                {actionLoading === review.reviewId ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <Check className="mr-1 h-4 w-4" />
                                    Approve
                                  </>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  setSelectedReview(review);
                                  setShowDeleteDialog(true);
                                }}
                                disabled={actionLoading === review.reviewId}
                              >
                                <X className="mr-1 h-4 w-4" />
                                Reject
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Approved Reviews Tab */}
        <TabsContent value="approved">
          <Card>
            <CardHeader>
              <CardTitle>Approved Reviews</CardTitle>
              <CardDescription>
                Currently visible reviews on the website
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <ReviewSkeleton />
              ) : approvedReviews.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    No approved reviews yet
                  </p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead>Comment</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {approvedReviews.map((review) => (
                        <TableRow key={review.reviewId}>
                          <TableCell className="font-medium">
                            {review.productName}
                          </TableCell>
                          <TableCell>{review.userName}</TableCell>
                          <TableCell>{renderStars(review.rating)}</TableCell>
                          <TableCell className="max-w-md">
                            <p className="line-clamp-2 text-sm">
                              {review.comment}
                            </p>
                          </TableCell>
                          <TableCell>
                            {new Date(review.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setSelectedReview(review);
                                setShowDeleteDialog(true);
                              }}
                              disabled={actionLoading === review.reviewId}
                            >
                              {actionLoading === review.reviewId ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <Trash2 className="mr-1 h-4 w-4" />
                                  Delete
                                </>
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Review?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this review? This action cannot be
              undone and the review will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {selectedReview && (
            <div className="my-4 p-4 bg-muted rounded-lg space-y-2">
              <p className="font-semibold">{selectedReview.productName}</p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {selectedReview.userName}
                </span>
                {renderStars(selectedReview.rating)}
              </div>
              <p className="text-sm">{selectedReview.comment}</p>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedReview) {
                  handleDelete(
                    selectedReview.productId,
                    selectedReview.reviewId
                  );
                }
              }}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete Review
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
