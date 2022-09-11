#include <stdio.h>
#include <stdlib.h>

typedef struct
{
    int a, b;
}pair;

int cmp(const void * p1, const void * p2)
{
    return (*(pair *)p1).a - (*(pair *)p2).a;
}

int lower_bound(pair * a, pair * x, int n, int (*cmp)(const void *, const void *))
{
    int low = 0, high = n;
    while(low < high)
    {
        int mid = low + (high - low) / 2;
        if(cmp(x, a + mid) < 0)
            high = mid;
        else
            low = mid + 1;
    }
    if(low < n && cmp(a + low, x) < 0)
        ++low;
    return low;
}

int * closest_interval(pair * a, int n)
{
    pair * sort_a = (pair *)malloc(n * sizeof(pair));
    for(int i = 0; i < n; ++i)
        sort_a[i].a = a[i].a, sort_a[i].b = i;
    qsort(sort_a, n, sizeof(pair), cmp);
    int * res = (int *)malloc(n * sizeof(int));
    for(int i = 0; i < n; ++i) res[i] = -1;
    for(int i = 0; i < n; ++i)
    {
        pair * x = (pair *)malloc(sizeof(pair)); x->a = a[i].b; x->b = 0;
        int j = lower_bound(sort_a, x, n, cmp);
        if(j != n)
            res[i] = sort_a[j].b;
    }
    return res;
}

int main()
{
    pair p[] = 
    {    
        {1, 4},
        {2, 5},
        {8, 9},
        {6, 8},
        {9, 10},
        {3, 4},
        {7, 9},
        {5, 7},
    };
    int n = sizeof(p)/ sizeof(*p),
    * res = closest_interval(p, n);
    for(int i = 0; i < n; ++i)
        printf("%d ", res[i]);
}