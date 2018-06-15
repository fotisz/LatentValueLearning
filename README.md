# LatentValueLearning
## Latent variable learning in recommendations sytems

Each circle is assumed to have some latent value along the horizontal axis - some true value for an attribute that we cannot observe directly but that we can try to estimate based on feedback from attempted pair-matches involving one A element and one B element.

The algorithm used to find them is as follows:

assign each entity a current estimated latent value, initialized at the center of the scale
select A-B pairs randomly, weighted by the distance between their current estimated latent value (shorter distances produce higher probabilities of selection)
if the feedback from the pair attempt says their relative latent values are different than what our estimates suggest, move both of the current estimated latent values in the direction of feedback (e.g. if A says B is too small, then move A to the right and B to the left), multiplied by a learning rate
repeat
The underlying simulation, then, is running this algorithm over a set of entities while also simulating the entities - each has its own latent value and the feedback it provides when paired with other entities is based on the actual differences between their latent values, with some noise added for good measure.

The svg update is straightforward - at each timestep, pairs are shown by lines between the circles, and the circles are transitioned to their new location based on their current estimated latent value.
