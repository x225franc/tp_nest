<template>
	<div class="mc-page d-flex align-items-center">
		<div class="container text-center" STYLE="color:white">
			<h1 class="display-4">404</h1>
			<p class="lead">Oups! La page que vous cherchez n'existe pas.</p>
			<button class="btn btn-info" @click="$router.push('/')">
				Retour
			</button>
		</div>
	</div>
</template>
