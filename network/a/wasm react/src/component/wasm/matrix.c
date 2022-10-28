#include <stdlib.h>
#include <math.h>
#include <emscripten/emscripten.h>
#define live EMSCRIPTEN_KEEPALIVE
int n;

live float * multiply(float * a, float * b, float * c, int n)
{
    for(int i = 0; i < n; ++i)
    {
        for(int j = 0; j < n; ++j)
        {
            c[i * n + j] = 0;
            for(int k = 0; k < n; ++k)
                c[i * n + j] += a[i * n + k] * b[k * n + j];
        }
    }
    return c;
}

live int add(int a, int b)
{/* debug */
    return a + b;
}

live float ** malloc2()
{
    float ** a = (float **)malloc(n * sizeof(float *));
    for(int i = 0; i < n; ++i)
        a[i] = (float *)malloc(n * sizeof(float));
    return a;
}

live float determinant(float ** matrix, int idx)
{
    float det = 0, z = 1, ** m = malloc2();
    if(idx == 1)
        return **matrix;
    else
    {
        for(int i = 0; i < idx; ++i)
        {
            int x = 0, y = 0;
            for(int j = 0; j < idx; ++j)
            {
                for(int k = 0; k < idx; ++k)
                {
                    m[j][k] = 0;
                    if(j && i != k)
                    {
                        m[x][y] = matrix[j][k];
                        if(y < idx - 2)
                            ++y;
                        else
                            ++x, y = 0;
                    }
                }
            }
            det = det + z * (matrix[0][i] * determinant(m, idx - 1));
            z = -1 * z;
        }
    }
    return det;
}

live float ** tran(float ** matrix, float ** cof, int idx)
{
    float ** inv = malloc2();
    float tr[n][n];
    for(int i = 0; i < idx; ++i)
        for(int j = 0; j < idx; ++j)
            tr[i][j] = cof[j][i];
    float d = determinant(matrix, idx);
    for(int i = 0; i < idx; ++i)
        for(int j = 0; j < idx; ++j)
            inv[i][j] = tr[i][j] / d;
    return inv;
}

live float ** cofactor(float ** matrix, int idx)
{
    float ** m = malloc2(), ** cof = malloc2();
    for(int i1 = 0; i1 < idx; ++i1)
    {
        for(int i2 = 0; i2 < idx; ++i2)
        {
            int x = 0, y = 0;
            for(int i3 = 0; i3 < idx; ++i3)
            {
                for(int i4 = 0; i4 < idx; ++i4)
                {
                    if(i1 != i3 && i2 != i4)
                    {
                        m[x][y] = matrix[i3][i4];
                        if(y < idx - 2)
                            ++y;
                        else
                            ++x, y = 0;
                    }
                }
            }
            cof[i1][i2] = pow(-1, i1 + i2) * determinant(m, idx - 1);
        }
    }
    return tran(matrix, cof, idx);
}