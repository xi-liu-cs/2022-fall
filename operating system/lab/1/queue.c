#include "queue.h"

int main()
{
    int a[] = {0, 1, 2, 3, 4, 5, 6, 7, 8}, n = sizeof(a) / sizeof(*a);
    queue * q = queue_malloc(1);
    for(int i = 0; i < 3; ++i)
    {
        for(int j = 0; j < n; ++j)
        {
            push(q, a + j);
            print(q);
            printf("front = %d, back = %d\n", *(int *)front(q), *(int *)back(q));
        }
    }
    for(int i = 0; i < 3; ++i)
    {
        for(int j = 0; j < n; ++j)
        {
            pop(q);
            print(q);
            if(j != n - 1)
                printf("front = %d, back = %d\n", *(int *)front(q), *(int *)back(q));
        }
    }
    free_queue(q);
}