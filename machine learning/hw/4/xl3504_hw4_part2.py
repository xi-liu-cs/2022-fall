import pandas as pd
import numpy as np

df = pd.read_csv('spambase/spambase.data')
df

y = df.iloc[:, -1:] # last column in spambase.data is the label (y) for training the model, read last column from df
y = np.array(y).ravel()
x = df.iloc[: , :-1] # before train the model, remove label from data, remove last column from df
x = x.copy()
x = np.array(x) # transfer df to array

"""from sklearn.model_selection import train_test_split

x_train, x_test, y_train, y_test = train_test_split(x, y, test_size = 0.3, train_size = 0.7, random_state = 0) # split dataset into train and test dataset paired with its label
print(x_train.shape)
print(x_test.shape)
print(y_train.shape)
print(y_test.shape)"""

from sklearn.preprocessing import StandardScaler

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn import metrics
import random
n = 20
start, end = 0, 1000
estimator_array = [1, 3, 5, 10, 15, 20, 40, 70]
def decision_tree(criterion):
    print(criterion)
    for i in range(len(estimator_array)):
        a = []
        for j in range(n):
            rand = random.randint(start, end)
            x_train, x_test, y_train, y_test = train_test_split(x, y, test_size = 0.3, train_size = 0.7, random_state = rand)
            scaler = StandardScaler().fit(x_train)
            x_train = scaler.transform(x_train)
            x_test = scaler.transform(x_test)
            classifier = RandomForestClassifier(n_estimators = estimator_array[i], criterion = criterion, random_state = rand)
            classifier = classifier.fit(x_train, y_train)
            y_predict = classifier.predict(x_test)
            accuracy = metrics.accuracy_score(y_test, y_predict)
            a.append(accuracy)
        print(f'estimator: {estimator_array[i]}, accuracy: {max(a)}')
    print()

decision_tree('gini')
decision_tree('entropy')